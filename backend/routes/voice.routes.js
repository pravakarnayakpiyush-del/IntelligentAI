import express from "express";
import { tts } from "../controllers/voice.controller.js";

const router = express.Router();

router.post("/tts", tts);

export default router;
