import { NextRequest, NextResponse } from "next/server";
import { sendTranscriptionForAnalyse } from "@/utils/rabbitmq";

export async function POST(req: NextRequest) {
  try {
    console.log("Received request to upload file");
    const { userId, transcription } = await req.json();

    sendTranscriptionForAnalyse(transcription, userId);

    return NextResponse.json({
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
