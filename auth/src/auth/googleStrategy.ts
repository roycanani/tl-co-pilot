import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { User, userModel } from "../users/model";
import { redisClient } from "../common/redis";

// Debug output to verify environment variables
console.log("Google OAuth Config:");
console.log("Client ID:", process.env.GOOGLE_CLIENT_ID ? "Found" : "Missing");
console.log(
  "Client Secret:",
  process.env.GOOGLE_CLIENT_SECRET ? "Found" : "Missing"
);
console.log(
  "Redirect URI:",
  process.env.GOOGLE_REDIRECT_ADDRESS
    ? process.env.GOOGLE_REDIRECT_ADDRESS
    : "Missing"
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ email: profile._json.email });

        if (!user) {
          console.log("user creatin", profile._json);
          user = await userModel.create({
            userName: profile._json.email,
            email: profile._json.email,
            image: profile._json.picture,
            accessToken: accessToken,
            refreshedToken: refreshToken,
          });
        } else {
          console.log("User found", user._id);
          user = await userModel.findOneAndUpdate(
            {
              email: profile._json.email,
            },
            {
              accessToken: accessToken,
              refreshedToken: refreshToken,
            }
          );
        }
        if (!user) {
          done(new Error("User not found"), undefined);
          return;
        }
        try {
          const redisKey = `user_id:${user._id}`;
          await redisClient.set(
            redisKey,
            JSON.stringify({
              accessToken: accessToken,
              refreshToken: refreshToken,
            }),
            "EX",
            60 * 60
          );
          console.log(
            `Access token for user ${user._id} stored in Redis with key ${redisKey}.`
          );
        } catch (redisError) {
          console.error("Error storing token in Redis:", redisError);
          return;
        }
        done(null, user);
      } catch (err) {
        done(err, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as User)._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
