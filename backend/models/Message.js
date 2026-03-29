import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true
    },
    content: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "file", "image", "voice"],
      default: "text"
    },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
