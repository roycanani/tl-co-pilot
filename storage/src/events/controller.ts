import { Event, eventModel } from "./model";
import { Request, Response } from "express";
import BaseController from "../common/base_controller";

class EventsController extends BaseController<Event> {
  constructor() {
    super(eventModel);
  }
}

export default new EventsController();
