import multer from "multer";
import BadRequestError from "../errors/BadRequestError";

const storageMain = multer.diskStorage({
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const parts = file.originalname.split(".");
    const extension = parts.length > 1 ? parts.pop() : "bin";
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extension);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/") || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError("Only PDF, JPG, PNG, DOC, and DOCX files are allowed for medical reports"));
  }
};

const reportUpload = multer({
  storage: storageMain,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
});

export default reportUpload;
