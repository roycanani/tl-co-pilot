"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import {
  Loader2,
  Upload,
  FileAudio,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import ProtectedRoute from "../../components/protected-route";
import Swal from "sweetalert2";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export default function UploadAudioPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file type - now accepting both MP3 and WAV
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
      ];
      if (!validTypes.some((type) => file.type.includes(type))) {
        setErrorMessage("Please select an MP3 or WAV file");
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage("File size exceeds 50MB limit");
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

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileName", selectedFile.name);

    try {
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Upload failed");
        setUploadStatus("error");
        return;
      }

      const data = await response.json();
      console.log("Upload response:", data);
      setUploadStatus("processing");

      Swal.fire({
        title: "Processing Audio",
        text: "Your audio file is being processed. Action items will be ready in a few minutes.",
        icon: "success",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 10000,
        timerProgressBar: true,
      });

      setUploadStatus("success");
      router.push(`/dashboard`);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("Failed to upload file");
      setUploadStatus("error");
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
          Upload Audio Recording
        </h1>

        <div className="mb-8 max-w-2xl rounded-lg bg-white p-6 shadow-md">
          <p className="mb-4 text-gray-700">
            Upload an MP3 or WAV file to generate action items from your audio
            recording.
          </p>

          {/* File Input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav"
            className="hidden"
          />

          {/* Upload Zone */}
          <div
            onClick={uploadStatus === "idle" ? triggerFileInput : undefined}
            className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
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
                    <FileAudio className="mx-auto mb-2 h-10 w-10 text-blue-500" />
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-10 w-10 text-blue-500" />
                    <p className="text-lg font-medium">
                      Click to select an audio file
                    </p>
                    <p className="text-sm text-gray-500">MP3 or WAV format</p>
                  </div>
                )}
              </>
            )}

            {uploadStatus === "uploading" && (
              <div className="text-center">
                <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}

            {uploadStatus === "processing" && (
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin text-blue-500" />
                <p className="text-lg font-medium">Processing audio...</p>
                <p className="text-sm text-gray-500">
                  This may take a few moments
                </p>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
                <p className="text-lg font-medium">Upload successful!</p>
                <p className="text-sm text-gray-500">
                  Redirecting to action items...
                </p>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="text-center">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-500" />
                <p className="text-lg font-medium">Upload failed</p>
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}
          </div>

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
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className={`rounded px-4 py-2 font-medium
                    ${
                      selectedFile
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-500"
                    }`}
                >
                  Upload Audio
                </button>

                {selectedFile && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Change File
                  </button>
                )}
              </>
            )}

            {uploadStatus === "error" && (
              <button
                onClick={() => setUploadStatus("idle")}
                className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl rounded-lg bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Tips for best results:</h2>
          <ul className="ml-5 list-disc space-y-2 text-gray-700">
            <li>Supported formats: MP3 and WAV</li>
            <li>
              Upload clear audio recordings for better transcription accuracy
            </li>
            <li>Recommended file size: less than 50MB</li>
            <li>Processing time varies based on the recording length</li>
            <li>
              For meeting recordings, ensure speakers identify themselves when
              possible
            </li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
