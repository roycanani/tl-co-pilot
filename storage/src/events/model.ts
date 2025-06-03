import { Schema, model } from "mongoose";

export interface Event {
  userId: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string; // ISO 8601 format
  updated: string; // ISO 8601 format
  summary: string;
  location: string;
  description: string;
  creator: {
    email: string;
    self: boolean;
  };
  organizer: {
    email: string;
    self: boolean;
  };
  start: {
    dateTime: string; // ISO 8601 format
    timeZone?: string;
  };
  end: {
    dateTime: string; // ISO 8601 format
    timeZone?: string;
  };
  reminders: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  finished: boolean;
}

const eventSchema = new Schema<Event>({
  id: { type: String, required: true },
  userId: { type: String, required: true, default: "" },
  status: { type: String, required: true },
  htmlLink: { type: String, required: true },
  created: { type: String, required: true },
  updated: { type: String, required: true },
  summary: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  creator: {
    email: { type: String, required: true },
    self: { type: Boolean, required: true },
  },
  organizer: {
    email: { type: String, required: true },
    self: { type: Boolean, required: true },
  },
  start: {
    dateTime: { type: String, required: true },
    timeZone: { type: String },
  },
  end: {
    dateTime: { type: String, required: true },
    timeZone: { type: String },
  },
  reminders: {
    useDefault: { type: Boolean, required: true },
    overrides: [
      {
        method: { type: String },
        minutes: { type: Number },
      },
    ],
  },
  finished: { type: Boolean, default: false },
});

export const eventModel = model<Event>("Event", eventSchema);
