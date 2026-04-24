import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer Storage Configuration for General Media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/banners");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit for videos
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

    const fileUrl = `/uploads/banners/${req.file.filename}`;
    
    res.json({ 
      message: "Media uploaded successfully", 
      url: fileUrl 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};
