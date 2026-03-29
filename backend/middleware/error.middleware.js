import multer from "multer";

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Server error"
  });
};
