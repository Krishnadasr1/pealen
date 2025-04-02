import { upload } from "../config/cloudinary.js";

export const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Image upload failed" });
    }
    next();
  });
};

export const uploadMultipleImages = (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => { 
      if (err) {
        return res.status(400).json({ error: "Image upload failed" });
      }
      next();
    });
  };