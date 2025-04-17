import { Task, taskModel } from "./model";
import { Request, Response } from "express";
import BaseController from "../common/base_controller";

class TasksController extends BaseController<Task> {
  constructor() {
    super(taskModel);
  }
}

export default new TasksController();
