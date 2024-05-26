import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        return uploadResponse;
    } catch (error) {
        console.log("!!! ERROR IN CLOUDINARY FILE UPLOAD !!!");
        console.log(error);
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadToCloudinary };