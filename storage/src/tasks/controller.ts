import { Task, taskModel } from "./model";
import { Request, Response } from "express";
import BaseController from "../common/base_controller";

class TasksController extends BaseController<Task> {
  constructor() {
    super(taskModel);
  }

  async markAsFinished(req: Request, res: Response) {
    const taskId = req.params.id;
    try {
      const task = await this.model.findOneAndUpdate(
        { id: taskId },
        { finished: true },
        { new: true }
      );
      if (!task) {
        res.status(404).send({ message: "Task not found" });
      }
      res.send(task);
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
}

export default new TasksController();
