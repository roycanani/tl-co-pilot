import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import fs from "fs";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import express, { Express } from "express";
import authRouter from "./auth/route";
import passport from "passport";
import "./auth/googleStrategy";
import cors from "cors";
import http from "http";
import https from "https";
import usersRouter from "./users/route";

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:80",
    "http://localhost",
    "http://node119.cs.colman.ac.il",
    "http://node119.cs.colman.ac.il:4000",
    "http://node119.cs.colman.ac.il:80",
    "https://localhost:80",
    "https://localhost",
    "https://node119.cs.colman.ac.il",
    "https://node119.cs.colman.ac.il:4000",
    "https://node119.cs.colman.ac.il:80",
    "https://localhost:4000",
    "http://localhost:4000",
    "https://localhost:8080",
    "http://localhost:8080",
    "*",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use(express.static("public"));

app.enable("trust proxy");

if (process.env.USE_HTTPS === "true") {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: BASE_URL }],
  },
  apis: ["./src/**/*route.ts"],
};
const specs = swaggerJSDoc(options);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));
app.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = () => {
  return new Promise<{ app: Express; server: http.Server }>(
    (resolve, reject) => {
      if (!process.env.DB_CONNECT) {
        reject("DB_CONNECT is not defined in .env file");
      } else {
        mongoose
          .connect(process.env.DB_CONNECT)
          .then(() => {
            console.log(process.env.USE_HTTPS);
            if (process.env.USE_HTTPS === "true") {
              console.log("Using HTTPS");
              const keyPath =
                process.env.SSL_KEY_PATH || "/certs/selfsigned.key";
              const certPath =
                process.env.SSL_CERT_PATH || "/certs/selfsigned.crt";
              const key = fs.readFileSync(keyPath);
              const cert = fs.readFileSync(certPath);
              const server = https.createServer({ key, cert }, app);
              resolve({ app, server });
            } else {
              const server = http.createServer(app);
              resolve({ app, server });
            }
          })
          .catch((error) => {
            reject(error);
          });
      }
    }
  );
};

export default initApp;
