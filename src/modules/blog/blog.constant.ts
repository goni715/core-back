export const BLOG_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
  ARCHIEVED: "archieved", // Alias to support user's spelling
} as const;

export const BLOG_STATUS_VALUES = [
  "published",
  "draft",
  "archived",
  "archieved",
] as const;

export const BLOG_SEARCHABLE_FIELDS = ["title", "author", "content"];
