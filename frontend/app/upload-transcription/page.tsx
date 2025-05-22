"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ProtectedRoute from "../../components/protected-route";
import Swal from "sweetalert2";
import { useAuth } from "../../context/auth-context";

type UploadMethod = "text" | "file";
type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export default function UploadTranscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("text");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle upload method selection
  const handleMethodChange = (method: UploadMethod) => {
    setUploadMethod(method);
    setErrorMessage(null);
  };

  // Handle text input change
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTranscriptionText(e.target.value);
    setErrorMessage(null);
  };

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file type
      const validTypes = [
        "text/plain",
        "text/markdown",
        "application/octet-stream",
        ".txt",
        ".md",
        ".srt",
      ];
      const isValidType = validTypes.some(
        (type) =>
          file.type.includes(type) ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".srt")
      );

      if (!isValidType) {
        setErrorMessage("Please select a text file (.txt, .md, .srt)");
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File size exceeds 10MB limit");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUploadStatus("uploading");

    try {
      let transcription = "";

      // Get transcription content based on upload method
      if (uploadMethod === "text") {
        if (!transcriptionText.trim()) {
          setErrorMessage("Please enter transcription text");
          setUploadStatus("idle");
          return;
        }
        transcription = transcriptionText;
      } else {
        if (!selectedFile) {
          setErrorMessage("Please select a file");
          setUploadStatus("idle");
          return;
        }

        // Read file content
        try {
          transcription = await selectedFile.text();
        } catch (error) {
          console.error("Error reading file:", error);
          setErrorMessage("Failed to read file content");
          setUploadStatus("error");
          return;
        }
      }

      // Send to API
      const response = await fetch("/api/upload-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
          userId: user?._id || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload response:", data);

      setUploadStatus("success");

      setTimeout(() => {
        Swal.fire({
          title: "Processing Transcription",
          text: "Your transcription is being processed. Action items will be ready in a few moments.",
          icon: "success",
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
        router.push(`/dashboard`);
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(
        (error as Error).message || "Failed to upload transcription"
      );
      setUploadStatus("error");
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
          Upload Transcription
        </h1>

        <div className="mb-8 max-w-2xl rounded-lg bg-white p-6 shadow-md">
          <p className="mb-4 text-gray-700">
            Upload a transcription directly or from a text file to generate
            action items.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Upload Method Selection */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="h-4 w-4 text-blue-600"
                    checked={uploadMethod === "text"}
                    onChange={() => handleMethodChange("text")}
                  />
                  <span className="ml-2">Enter text directly</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="h-4 w-4 text-blue-600"
                    checked={uploadMethod === "file"}
                    onChange={() => handleMethodChange("file")}
                  />
                  <span className="ml-2">Upload text file</span>
                </label>
              </div>
            </div>

            {/* Text Area for Direct Input */}
            {uploadMethod === "text" && (
              <div className="mb-6">
                <textarea
                  className="w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={12}
                  placeholder="Paste your transcription here..."
                  value={transcriptionText}
                  onChange={handleTextChange}
                  disabled={uploadStatus !== "idle"}
                ></textarea>
              </div>
            )}

            {/* File Upload Area */}
            {uploadMethod === "file" && (
              <div className="mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.md,.srt,text/plain"
                  className="hidden"
                />

                <div
                  onClick={
                    uploadStatus === "idle" ? triggerFileInput : undefined
                  }
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
                    ${
                      uploadStatus === "idle"
                        ? "border-blue-300 hover:border-blue-500"
                        : "border-gray-200"
                    }`}
                >
                  {uploadStatus === "idle" && (
                    <>
                      {selectedFile ? (
                        <div className="text-center">
                          <FileText className="mx-auto mb-2 h-10 w-10 text-blue-500" />
                          <p className="text-lg font-medium">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ({(selectedFile.size / 1024).toFixed(2)} KB)
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-10 w-10 text-blue-500" />
                          <p className="text-lg font-medium">
                            Click to select a text file
                          </p>
                          <p className="text-sm text-gray-500">
                            .txt, .md, or .srt format
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Status Indicators */}
            {uploadStatus === "uploading" && (
              <div className="mb-6 text-center">
                <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin text-blue-500" />
                <p className="text-lg font-medium">
                  Uploading transcription...
                </p>
              </div>
            )}

            {uploadStatus === "processing" && (
              <div className="mb-6 text-center">
                <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin text-blue-500" />
                <p className="text-lg font-medium">
                  Processing transcription...
                </p>
                <p className="text-sm text-gray-500">
                  This may take a few moments
                </p>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="mb-6 text-center">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
                <p className="text-lg font-medium">Upload successful!</p>
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="mb-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-500" />
                <p className="text-lg font-medium">Upload failed</p>
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && uploadStatus === "idle" && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {uploadStatus === "idle" && (
                <>
                  <button
                    type="submit"
                    className={`rounded px-4 py-2 font-medium
                      ${
                        (uploadMethod === "text" && transcriptionText.trim()) ||
                        (uploadMethod === "file" && selectedFile)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "cursor-not-allowed bg-gray-200 text-gray-500"
                      }`}
                    disabled={
                      (uploadMethod === "text" && !transcriptionText.trim()) ||
                      (uploadMethod === "file" && !selectedFile)
                    }
                  >
                    Upload Transcription
                  </button>

                  {uploadMethod === "file" && selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Change File
                    </button>
                  )}
                </>
              )}

              {(uploadStatus === "error" || uploadStatus === "success") && (
                <button
                  type="button"
                  onClick={() => setUploadStatus("idle")}
                  className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                >
                  {uploadStatus === "error" ? "Try Again" : "Upload Another"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl rounded-lg bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Tips for best results:</h2>
          <ul className="ml-5 list-disc space-y-2 text-gray-700">
            <li>Supported file formats: TXT, MD, SRT</li>
            <li>
              For best results, ensure the transcription is properly formatted
            </li>
            <li>
              Include speaker labels if available (e.g., &quot;Speaker 1:&quot;,
              &quot;John:&quot;)
            </li>
            <li>Maximum file size: 10MB</li>
            <li>Processing time varies based on the transcription length</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
