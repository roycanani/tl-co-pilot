import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import express, { Express } from "express";
import postsRouter from "./posts/route";
import eventsRouter from "./events/route";
import tasksRouter from "./tasks/route";

const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next(); // Pass control to the next middleware or route handler
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/posts", postsRouter);
app.use("/events", eventsRouter);
app.use("/tasks", tasksRouter);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description:
        "REST server including authentication using JWT by Roy Canani & Urir Shiber",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./src/**/*route.ts"],
};
const specs = swaggerJSDoc(options);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.DB_CONNECT) {
      reject("DB_CONNECT is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.DB_CONNECT)
        .then(() => {
          resolve(app);
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};

export default initApp;
