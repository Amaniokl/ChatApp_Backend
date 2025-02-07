import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }
    
    
    try {
        // console.log("Cloudinary Config:", {
        //     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        //     api_key: process.env.CLOUDINARY_API_KEY,
        //     api_secret: process.env.CLOUDINARY_API_SECRET
        // });
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("File is uploaded on Cloudinary", response.url);

        // Remove the local file after upload
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
};


const deleteFilesFromCloudinary = async (public_id) => {
    if (!public_id) {
        console.warn("No public_id provided for Cloudinary deletion.");
        return null;
    }

    try {
        const response = await cloudinary.uploader.destroy(public_id);
        console.log("File deleted from Cloudinary", public_id, response);
        return response;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", public_id, error);
        return null;
    }
};


export { uploadOnCloudinary , deleteFilesFromCloudinary};