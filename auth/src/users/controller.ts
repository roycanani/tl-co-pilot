import BaseController from "../common/base_controller";
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
}

export default new UsersController();
