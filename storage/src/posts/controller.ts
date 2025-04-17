import { Post, postModel } from "./model";
import { Request, Response } from "express";
import BaseController from "../common/base_controller";

class PostsController extends BaseController<Post> {
  constructor() {
    super(postModel);
  }

  async create(req: Request, res: Response) {
    const sender = req.params.userId;
    const post = {
      ...req.body,
      sender,
    };
    req.body = post;
    super.create(req, res);
  }

  async getAll(req: Request, res: Response) {
    if (Object.keys(req.query).length === 0) {
      super.getAll(req, res);
    } else {
      try {
        const posts = await this.model.find(req.query as Partial<Post>);
        res.send(posts);
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
}

export default new PostsController();
