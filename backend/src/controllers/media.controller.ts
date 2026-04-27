import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { uploadToR2 } from "../services/storage.service";

// Multer Configuration for Memory Storage
const storage = multer.memoryStorage();

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported (Only MP4, JPG, PNG, WEBP, GIF allowed)"));
    }
  },
});

export const handleMediaUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = "banner-" + uniqueSuffix + path.extname(req.file.originalname);

    // Upload buffer to R2
    const fileUrl = await uploadToR2(
      req.file.buffer,
      filename,
      req.file.mimetype,
      "banners"
    );
    
    res.json({ 
      message: "Media uploaded successfully", 
      url: fileUrl 
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};
