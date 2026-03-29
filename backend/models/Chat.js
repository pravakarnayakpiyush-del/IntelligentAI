import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null }
  },
  { timestamps: true }
);

chatSchema.index({ updatedAt: -1 });

export default mongoose.model("Chat", chatSchema);
