import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config"
 
cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
});

const fileUploader = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting local file:", err);
      } else {
        console.log("Local file deleted successfully");
      }
    });

    return response;
  } catch (error) {
    console.log("File uploading to Cloudinary Failed! |", error);

    fs.unlinkSync(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting file after failed upload:", err);
      } else {
        console.log("Temporary file deleted after failed upload.");
      }
    });

    return null;
  }
};

export { fileUploader };
