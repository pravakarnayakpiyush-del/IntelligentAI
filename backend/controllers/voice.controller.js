export const tts = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    res.json({
      message: "Use client-side speech synthesis for audio playback.",
      text
    });
  } catch (err) {
    next(err);
  }
};
