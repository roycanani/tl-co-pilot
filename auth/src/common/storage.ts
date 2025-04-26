import path from "path";
import * as fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";

const STORAGE_PATH = "public/images";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_PATH),
  filename: (req, file, cb) =>
    cb(null, uuidv4() + path.extname(file.originalname)),
});

const upload = multer({ storage: storage });

export const uploadFile = (req: Request, res: Response): Promise<void> =>
  new Promise((resolve, reject) =>
    upload.single("file")(req, res, (err) => (err ? reject(err) : resolve()))
  );

export const deleteFile = (fileName: string) => {
  fs.unlink(`${STORAGE_PATH}/${fileName}`, (err) => {
    if (err) console.error(err);
  });
};
