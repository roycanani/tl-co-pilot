import mongoose from "mongoose";

export interface Post {
  title: string;
  content: string;
  sender: mongoose.Types.ObjectId;
  comments: mongoose.Types.ObjectId[];
}

const postSchema = new mongoose.Schema<Post>({
  title: { type: String, required: true },
  content: { type: String },
  comments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Comment",
    default: [],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const postModel = mongoose.model<Post>("Post", postSchema);
