import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";
import fileRoutes from "./routes/file.routes.js";
import voiceRoutes from "./routes/voice.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,https://super-starship-000fa0.netlify.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/chat", chatRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/voice", voiceRoutes);

app.use(errorHandler);

export default app;
