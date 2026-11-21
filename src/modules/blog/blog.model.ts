import { Schema, model } from "mongoose";
import { BLOG_STATUS, BLOG_STATUS_VALUES } from "./blog.constant";
import { IBlog } from "./blog.interface";

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      default: "Admin",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: BLOG_STATUS_VALUES,
        message: "{VALUE} is not a valid blog status",
      },
      default: BLOG_STATUS.PUBLISHED,
      lowercase: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views count cannot be negative"],
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

blogSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });

const BlogModel = model<IBlog>("Blog", blogSchema);
export default BlogModel;
