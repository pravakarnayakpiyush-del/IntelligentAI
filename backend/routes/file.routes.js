import express from "express";
import { upload } from "../middleware/upload.middleware.js";
import { uploadFile, uploadImage } from "../controllers/file.controller.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadFile);
router.post("/image", upload.single("image"), uploadImage);

export default router;
