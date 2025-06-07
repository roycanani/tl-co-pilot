import { NextFunction, Request, Response } from "express";
import { userModel } from "../users/model";
import { generateToken } from "../common/jwt";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}
interface User extends Document {
  _id: string;
  email: string;
  userName: string;
  password?: string;
  image: string;
  refreshToken?: string[];
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

const loginOIDC = async (req: Request, res: Response) => {
  console.log("loginOIDC");
  console.log("req.user", req.user);
  try {
    if (!req.user) {
      res.status(400).send("Problem with the login");
      return;
    }
    const userReq = req.user as {
      email: string;
      picture: string;
    };
    const user = await userModel.findOne({ email: userReq.email });
    if (!user) {
      res.status(400).send("Problem with the login - user not found");
      return;
    }

    const tokens = await loginGenerateTokenValidation(res, user); // Generate tokens for UI
    if (!tokens) {
      res.status(500).send("Failed to generate tokens");
      return;
    }
    res.redirect(
      `${
        process.env.GOOGLE_REDIRECT_ADDRESS ?? "http://localhost:8080"
      }/oidc-login?accessToken=${tokens.accessToken}&refreshToken=${
        tokens.refreshToken
      }&_id=${user._id}`
    );
  } catch (err) {
    console.error("Error in loginOIDC:", err);
    res.status(400).send("An error occurred during OIDC login.");
  }
};

const userInfo = async (req: Request, res: Response) => {
  try {
    // Return user information from the decoded token
    console.log("user", req.user);
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in user-info route:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve user information",
    });
  }
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    res.status(401).send("Access Denied: No token provided");
    return;
  }
  if (!process.env.SERVER_TOKEN_SECRET) {
    console.error("SERVER_TOKEN_SECRET is not defined");
    res.status(500).send("Server Error: Token secret not configured");
    return;
  }

  jwt.verify(token, process.env.SERVER_TOKEN_SECRET, (err, payload) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      res.status(401).send("Access Denied: Invalid token");
      return;
    }
    req.user = payload;
    next();
  });
};

export default {
  loginOIDC,
  userInfo,
  // Removed register, login, refresh, logout
};
