import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  profilePicture: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  }).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
