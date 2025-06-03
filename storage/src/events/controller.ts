import { Event, eventModel } from "./model";
import { Request, Response } from "express";
import BaseController from "../common/base_controller";

class EventsController extends BaseController<Event> {
  constructor() {
    super(eventModel);
  }

  async markAsFinished(req: Request, res: Response) {
    const eventId = req.params.id;
    try {
      const event = await this.model.findOneAndUpdate(
        { id: eventId },
        { finished: true },
        { new: true }
      );
      if (!event) {
        res.status(404).send({ message: "Event not found" });
      }
      res.send(event);
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

export default new EventsController();
