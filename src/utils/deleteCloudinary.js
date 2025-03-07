import { v2 as cloudinary } from "cloudinary";
import "dotenv/config"


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
  });

async function deleteFromCloudinary(url) {
    try {
        // Extract public_id from the URL
        const publicId = url.split('/').pop().split('.')[0];

        // Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('File deleted successfully:', result);
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
    }
}

export {deleteFromCloudinary};