import pdf from "pdf-parse";

export const parsePDF = async (buffer) => {
  const data = await pdf(buffer);
  return data.text;
};
