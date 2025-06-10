import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { writeFile } from "fs/promises";
import { sendFileForSTT } from "@/utils/rabbitmq";

// Disable body parsing by Next.js (required for formidable)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: "tl-co-pilot", // process.env.GCP_PROJECT_ID,
  keyFilename: "./credentials/tl-co-pilot-0124a3abd527.json", // process.env.GCP_KEY_FILE,
});

const bucketName = process.env.GCP_BUCKET_NAME || "tl-copilot-files";

export async function POST(req: NextRequest) {
  try {
    console.log("Received request to upload file");

    const formData = await req.formData();
    console.log("Form data received:", formData);
    const userId = formData.get("userId") as string;

    const file: File = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replaceAll(" ", "_");
    const pathToFile = path.join(process.cwd(), "public/assets/" + filename);
    console.log("File path to save:", pathToFile);
    try {
      await writeFile(pathToFile, buffer);
    } catch (error) {
      console.log("Error occured ", error);
    }

    console.log("File saved successfully at:", pathToFile);
    console.log("Uploading file to GCP bucket:", bucketName);
    // Upload the file to GCP bucket
    const bucket = storage.bucket(bucketName);
    await bucket.upload(pathToFile, {
      destination: uniqueFileName,
      metadata: {
        contentType: file.type,
      },
    });

    // Clean up temporary file
    await fs.unlink(pathToFile);

    sendFileForSTT(`gs://tl-copilot-files/${uniqueFileName}`, userId);

    return NextResponse.json({
      message: "File uploaded successfully",
      fileId: uniqueFileName,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
