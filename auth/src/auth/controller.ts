import { NextFunction, Request, Response } from "express";
import { userModel } from "../users/model";
import bcrypt from "bcrypt";
import { generateToken, verifyRefreshToken } from "../common/jwt";
import jwt from "jsonwebtoken";

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, userName } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      email,
      userName,
      password: hashedPassword,
    });
    res.status(200).send(user);
  } catch (err) {
    res.status(400).send(err);
  }
};

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const loginGenerateTokenValidation = async (
  res: Response,
  user: User
): Promise<Tokens | undefined> => {
  if (!process.env.SERVER_TOKEN_SECRET) {
    res.status(500).send("Server Error");
    return;
  }

  const tokens = generateToken(
    user._id.toString(),
    user.userName,
    user.email,
    user.image
  );
  if (!tokens) {
    res.status(500).send("Server Error");
    return;
  }
  if (!user.refreshToken) {
    user.refreshToken = [];
  }
  user.refreshToken.push(tokens.refreshToken);
  await user.save();
  return tokens;
};

const login = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      res.status(400).send("wrong username or password");
      return;
    }
    const tokens = await loginGenerateTokenValidation(res, user);

    res.status(200).send({
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const loginOIDC = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(400).send("Problem with the login");
      return;
    }
    const userReq = req.user as { email: string; picture: string };
    const user = await userModel.findOne({ email: userReq.email });
    if (!user) {
      res.status(400).send("Problem with the login");
      return;
    }

    const tokens = await loginGenerateTokenValidation(res, user);
    res.redirect(
      `${
        process.env.GOOGLE_REDIRECT_ADDRESS ?? "http://localhost:8080"
      }/oidc-login?accessToken=${tokens?.accessToken}&refreshToken=${
        tokens?.refreshToken
      }&_id=${user._id}`
    );
  } catch (err) {
    res.status(400).send(err);
  }
};

import { Document } from "mongoose";

interface User extends Document {
  _id: string;
  email: string;
  userName: string;
  password: string;
  image: string;
  refreshToken?: string[];
}

const logout = async (req: Request, res: Response) => {
  try {
    const user = await verifyRefreshToken(req.body.refreshToken);
    await user.save();
    res.status(200).send("success");
  } catch (err) {
    res.status(400).send("fail " + err);
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const user = await verifyRefreshToken(req.body.refreshToken);
    if (!user) {
      res.status(400).send("fail");
      return;
    }
    const tokens = generateToken(
      user._id,
      user.userName,
      user.email,
      user.image
    );

    if (!tokens) {
      res.status(500).send("Server Error");
      return;
    }
    if (!user.refreshToken) {
      user.refreshToken = [];
    }
    user.refreshToken.push(tokens.refreshToken);
    await user.save();
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send("fail " + err);
  }
};

type Payload = {
  _id: string;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    res.status(401).send("Access Denied");
    return;
  }
  if (!process.env.SERVER_TOKEN_SECRET) {
    res.status(500).send("Server Error");
    return;
  }

  jwt.verify(token, process.env.SERVER_TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(401).send("Access Denied");
      return;
    }
    req.params.userId = (payload as Payload)._id;
    next();
  });
};

export default {
  register,
  login,
  refresh,
  logout,
  loginOIDC,
};
