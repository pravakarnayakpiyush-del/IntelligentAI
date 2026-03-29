import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === "application/pdf";
  const isCsv = file.mimetype.includes("csv");
  const isImage = file.mimetype.startsWith("image/");

  if (isPdf || isCsv || isImage) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
