// utils/uploadProfilePhotoToCloud.ts
import cloudinary from "cloudinary";
// import axios from "axios";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export const uploadProfilePhotoToCloud = async (
  imageUrlOrBuffer: string | Buffer,
  folder = "profile-pictures"
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadOptions: cloudinary.UploadApiOptions = {
        folder,
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      };

      // If input is a Buffer (local file from form-data)
      if (Buffer.isBuffer(imageUrlOrBuffer)) {
        const stream = cloudinary.v2.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url);
          }
        );

        streamifier.createReadStream(imageUrlOrBuffer).pipe(stream);
      } else {
        // If input is a remote URL
        const result = await cloudinary.v2.uploader.upload(
          imageUrlOrBuffer,
          uploadOptions
        );
        resolve(result.secure_url);
      }
    } catch (err) {
      reject(err);
    }
  });
};
