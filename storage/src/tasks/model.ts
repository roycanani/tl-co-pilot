import mongoose, { Schema, model, Types } from "mongoose";

export interface Task {
  userId: string; // User ID associated with the task
  id: string;
  title: string;
  updated: string; // ISO 8601 format (e.g., "2025-03-31T20:31:08.205Z")
  notes: string;
  status: string;
  due: string; // ISO 8601 format (e.g., "2025-03-31T00:00:00.000Z")
  webViewLink: string;
  finished?: boolean; // Optional field to indicate if the task is finished
}

const taskSchema = new Schema<Task>({
  userId: { type: String, required: true, default: "" },
  id: { type: String, required: true },
  title: { type: String, required: true },
  updated: { type: String, required: true },
  notes: { type: String },
  status: { type: String, required: true },
  due: { type: String, required: true },
  webViewLink: { type: String, required: true },
  finished: { type: Boolean, default: false },
});

export const taskModel = model<Task>("Task", taskSchema);
