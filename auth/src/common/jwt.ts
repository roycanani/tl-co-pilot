import jwt from "jsonwebtoken";
import { User, userModel } from "../users/model";
import { Document } from "mongoose";
import { StringValue } from "ms";

type JWTToken = {
  accessToken: string;
  refreshToken: string;
};

export const generateToken = (
  userId: string,
  username: string,
  email: string,
  image: string
): JWTToken | null => {
  if (
    !process.env.SERVER_TOKEN_SECRET ||
    !process.env.TOKEN_EXPIRES ||
    !process.env.REFRESH_TOKEN_EXPIRES
  ) {
    return null;
  }

  const random = Math.random().toString();
  const accessToken = jwt.sign(
    {
      _id: userId,
      random: random,
      username: username,
      email: email,
      image: image,
    },
    process.env.SERVER_TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES as StringValue }
  );

  const refreshToken = jwt.sign(
    {
      _id: userId,
      random: random,
    },
    process.env.SERVER_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES as StringValue }
  );
  return {
    accessToken,
    refreshToken,
  };
};

export type TokenUser = Document<string, unknown, User> & User;

export const verifyRefreshToken = (refreshToken: string | undefined) => {
  return new Promise<TokenUser>((resolve, reject) => {
    if (!refreshToken || !process.env.SERVER_TOKEN_SECRET) {
      reject("fail");
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.SERVER_TOKEN_SECRET,
      async (err, payload) => {
        if (err || typeof payload !== "object") {
          reject("fail");
          return;
        }

        const userId = payload._id;
        try {
          const user = await userModel.findById(userId);
          if (!user) {
            reject("fail");
            return;
          }
          if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
            user.refreshToken = [];
            await user.save();
            reject("fail");
            return;
          }
          const tokens = user.refreshToken.filter(
            (token) => token !== refreshToken
          );
          user.refreshToken = tokens;

          resolve(user);
        } catch (err) {
          reject("fail " + err);
          return;
        }
      }
    );
  });
};
