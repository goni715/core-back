import { TFolder } from "./uploadToCloudinary";

const makePublicID = (url: string, directory: TFolder) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) {
      return "";
    }

    const parts: string[] = url.split("/");
    const lastPart = parts[parts.length - 1]?.split(".")[0];
    if (!lastPart) return "";

    const rootFolder = url.includes("/Coffee/") ? "Coffee" : "Health";
    return `${rootFolder}/${directory}/${lastPart}`;
  } catch {
    return "";
  }
};

export default makePublicID;
