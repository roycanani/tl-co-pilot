import { Request, Response } from "express";
import { Model, UpdateQuery } from "mongoose";

class BaseController<T> {
  model: Model<T>;
  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAll(req: Request, res: Response) {
    try {
      const items = await this.model.find();
      res.send(items);
    } catch (error) {
      const err = error as Error;
      if (err.name === "MongoServerSelectionError") {
        res.status(500).send({
          message: "Internal Server Error",
          details: "Database connection error",
        });
      } else {
        res
          .status(500)
          .send({ message: "Internal Server Error", details: err.message });
      }
    }
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;

    try {
      const item = await this.model.findById(id);
      if (item != null) {
        res.send(item);
      } else {
        res.status(404).send("not found");
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === "MongoServerSelectionError") {
        res.status(500).send({
          message: "Internal Server Error",
          details: "Database connection error",
        });
      } else {
        res
          .status(500)
          .send({ message: "Internal Server Error", details: err.message });
      }
    }
  }

  async create(req: Request, res: Response) {
    const body: T = req.body;
    try {
      const item = await this.model.create(body);
      res.status(201).send(item);
    } catch (error) {
      const err = error as Error;
      if (err.name === "ValidationError") {
        res.status(400).send({ message: "Bad Request", details: err.message });
      } else if (err.name === "MongoServerSelectionError") {
        res.status(500).send({
          message: "Internal Server Error",
          details: "Database connection error",
        });
      } else {
        res
          .status(500)
          .send({ message: "Internal Server Error", details: err.message });
      }
    }
  }

  async delete(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const item = await this.model.findByIdAndDelete(id);
      if (!item) res.status(404).send({ message: "Not found" });
      else res.status(200).send("deleted");
    } catch (error) {
      const err = error as Error;
      if (err.name === "ValidationError") {
        res.status(400).send({ message: "Bad Request", details: err.message });
      } else if (err.name === "MongoServerSelectionError") {
        res.status(500).send({
          message: "Internal Server Error",
          details: "Database connection error",
        });
      } else {
        res
          .status(500)
          .send({ message: "Internal Server Error", details: err.message });
      }
    }
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    const body: UpdateQuery<T> = req.body;
    try {
      const item = await this.model.findByIdAndUpdate(id, body, { new: true });
      if (!item) res.status(404).send({ message: "Not found" });
      else res.status(200).send("updated");
    } catch (error) {
      const err = error as Error;
      if (err.name === "ValidationError") {
        res.status(400).send({ message: "Bad Request", details: err.message });
      } else if (err.name === "MongoServerSelectionError") {
        res.status(500).send({
          message: "Internal Server Error",
          details: "Database connection error",
        });
      } else {
        res
          .status(500)
          .send({ message: "Internal Server Error", details: err.message });
      }
    }
  }
}

export default BaseController;
