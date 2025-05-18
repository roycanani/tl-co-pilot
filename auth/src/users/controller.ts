import BaseController from "../common/base_controller";
import { redisClient } from "../common/redis";
import { deleteFile, uploadFile } from "../common/storage";
import { User, userModel } from "./model";
import { Request, Response } from "express";

class UsersController extends BaseController<User> {
  constructor() {
    super(userModel);
  }
  async uploadImage(req: Request, res: Response) {
    try {
      await uploadFile(req, res);
    } catch (e) {
      if (req.file?.filename) deleteFile(req.file.filename);
      res.status(500).send({
        message: "Internal Server Error",
        details: e,
      });
    }
  }

  async update(req: Request, res: Response) {
    await this.uploadImage(req, res);
    req.body = JSON.parse(req.body.user);

    if (req.file?.filename) {
      req.body.image = `images/${req.file?.filename}`;
      const oldPhoto = (await userModel.findById(req.body._id))?.image;
      if (oldPhoto) deleteFile(oldPhoto);
    }

    await super.update(req, res);
  }

  async getUserToken(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        res.status(400).json({ message: "User ID must be provided." });
        return;
      }
      const tokenKey = `user_id:${userId}`;

      const tokens = await redisClient.get(tokenKey);

      if (tokens) {
        res.status(200).json(JSON.parse(tokens));
      } else {
        res
          .status(404)
          .json({ message: "Access token not found for this user." });
      }
    } catch (error) {
      console.error("Error retrieving access token:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
}

export default new UsersController();
