import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { User, userModel } from "../users/model"; // Adjust the path to your User model

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
        const user = await userModel.findOne({ email: profile._json.email });

        if (!user) {
          console.log("user creatin", profile._json);
          const createdUser = await userModel.create({
            userName: profile._json.email,
            email: profile._json.email,
            image: profile._json.picture,
          });
          done(null, createdUser);
        } else {
          console.log("User found", user);
          const updatedUser = await userModel.findOne({
            email: profile._json.email,
          });
          done(null, updatedUser!);
        }
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
