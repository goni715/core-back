/* eslint-disable @typescript-eslint/no-explicit-any */

import cloudinary from "../helpers/cloudinary";

export type TFolder = "user" | "hospital" | "doctor" | "agent" | "patient_report" | "health_tip" | "blog";

const uploadToCloudinary = async (path: string, folder: TFolder) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      folder: `Health/${folder}`,
      resource_type: "auto",
    });

    return {
      img_url: result.secure_url,
      public_id: result.public_id,
    };

  } catch (err: any) {
    throw new Error(err);
  }
};

export default uploadToCloudinary;