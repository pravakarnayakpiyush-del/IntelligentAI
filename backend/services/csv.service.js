import csv from "csv-parser";
import { Readable } from "stream";

export const parseCSV = async (buffer) => {
  const rows = [];
  return new Promise((resolve) => {
    Readable.from(buffer)
      .pipe(csv())
      .on("data", data => rows.push(data))
      .on("end", () => resolve(rows));
  });
};
