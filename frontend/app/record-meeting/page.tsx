"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Mic,
  StopCircle,
  Upload,
  Trash2,
} from "lucide-react";
import ProtectedRoute from "../../components/protected-route";
import Swal from "sweetalert2";
import { useAuth } from "../../context/auth-context";

// Helper function to convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44; // 2 bytes per sample for 16-bit audio
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let i, sample;
  let offset = 0;
  let pos = 0;

  // Helper to write data
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // Write WAV container
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // Write FMT subchunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // Subchunk1Size (16 for PCM)
  setUint16(1); // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate (SampleRate * BitsPerSample * Channels) / 8
  setUint16(numOfChan * 2); // block align (BitsPerSample * Channels) / 8
  setUint16(16); // bits per sample (16)

  // Write DATA subchunk
  setUint32(0x61746164); // "data"
  setUint32(buffer.length * numOfChan * 2); // Subchunk2Size (NumSamples * NumChannels * BitsPerSample) / 8

  // Get channel data
  for (i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  // Write PCM samples
  while (pos < length && offset < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // Interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // Clamp
      // Convert to 16-bit signed int
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([view], { type: "audio/wav" });
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";
type RecordingStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "processing"
  | "stopped"
  | "error";

export default function RecordMeetingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioFile, setRecordedAudioFile] = useState<File | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (recordingStatus === "recording") {
      const startTime = Date.now();
      setRecordingDuration(0); // Reset duration at start
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [recordingStatus]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [recordedAudioUrl]);

  const cleanupRecorder = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      mediaRecorderRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    setRecordingStatus("requesting_permission");
    setRecordingError(null);
    setErrorMessage(null);
    setUploadStatus("idle");
    setRecordedAudioFile(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);
    cleanupRecorder();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let chosenMimeType = "audio/wav";
      if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
        console.warn(
          "audio/wav not supported by this browser. Trying audio/webm."
        );
        chosenMimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
          console.warn(
            "audio/webm;codecs=opus not supported. Trying audio/mp4."
          );
          chosenMimeType = "audio/mp4"; // Common on Safari for audio
          if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
            console.warn(
              "audio/mp4 not supported. Using browser default MIME type."
            );
            chosenMimeType = ""; // Let the browser choose its default
          }
        }
      }

      const options = { mimeType: chosenMimeType };
      console.log(
        `Attempting to record with MIME type: '${
          options.mimeType || "browser default"
        }'`
      );

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const originalMimeType =
          mediaRecorderRef.current?.mimeType ||
          chosenMimeType ||
          "audio/octet-stream";
        console.log("Recording stopped. Original MIME type:", originalMimeType);

        let audioBlobToProcess = new Blob(audioChunksRef.current, {
          type: originalMimeType,
        });
        let finalMimeType = originalMimeType;
        let finalFileExtension: string;

        if (!originalMimeType.includes("wav")) {
          console.log(
            `Original format is ${originalMimeType}, attempting to convert to WAV.`
          );
          setRecordingStatus("processing"); // Indicate conversion processing
          try {
            const audioContext = new (window.AudioContext ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).webkitAudioContext)();
            const arrayBuffer = await audioBlobToProcess.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBlobToProcess = audioBufferToWav(audioBuffer);
            finalMimeType = "audio/wav";
            console.log("Successfully converted to WAV.");
          } catch (conversionError) {
            console.error("Error converting audio to WAV:", conversionError);
            setRecordingError(
              "Recording successful, but failed to convert to WAV. Using original format."
            );
            // Fallback: finalMimeType and audioBlobToProcess remain as original
          }
        }

        if (finalMimeType.includes("wav")) {
          finalFileExtension = "wav";
        } else if (finalMimeType.includes("webm")) {
          finalFileExtension = "webm";
        } else if (
          finalMimeType.includes("mp4") ||
          finalMimeType.includes("m4a")
        ) {
          finalFileExtension = "m4a";
        } else if (finalMimeType.includes("ogg")) {
          finalFileExtension = "ogg";
        } else {
          finalFileExtension = "audio";
          console.warn(
            `Using generic '.audio' extension for MIME type: ${finalMimeType}.`
          );
        }

        const audioUrl = URL.createObjectURL(audioBlobToProcess);
        setRecordedAudioUrl(audioUrl);
        const fileName = `meeting-recording-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.${finalFileExtension}`;
        const file = new File([audioBlobToProcess], fileName, {
          type: finalMimeType,
        });
        setRecordedAudioFile(file);
        setRecordingStatus("stopped");
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setRecordingError("An error occurred during recording.");
        setRecordingStatus("error");
        stream.getTracks().forEach((track) => track.stop());
        cleanupRecorder();
      };

      recorder.start();
      setRecordingStatus("recording");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setRecordingError(
        "Microphone access denied or not available. Please check browser permissions and ensure a microphone is connected."
      );
      setRecordingStatus("error");
      cleanupRecorder();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDiscardRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordedAudioFile(null);
    setRecordingDuration(0);
    setRecordingStatus("idle");
    setRecordingError(null);
    audioChunksRef.current = [];
    cleanupRecorder();
  };

  const resetToIdle = () => {
    handleDiscardRecording();
    setUploadStatus("idle");
    setErrorMessage(null);
  };

  const handleUploadRecording = async () => {
    if (!recordedAudioFile) {
      setErrorMessage("No recording available to upload.");
      return;
    }
    if (!user || !user._id) {
      setErrorMessage("User not authenticated. Please log in again.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", recordedAudioFile);
    formData.append("fileName", recordedAudioFile.name);
    formData.append("userId", user._id);

    try {
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Upload failed: " + response.statusText }));
        throw new Error(errorData.message || "Upload failed");
      }

      await response.json();
      setUploadStatus("success");

      Swal.fire({
        title: "Processing Recording",
        text: "Your recording is being processed. Action items will be ready in a few minutes.",
        icon: "success",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
      setTimeout(() => {
        router.push(`/dashboard`);
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage((error as Error).message || "Failed to upload recording");
      setUploadStatus("error");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
          Record a Meeting
        </h1>

        <div className="mb-8 max-w-2xl rounded-lg bg-white p-6 shadow-md">
          <p className="mb-6 text-gray-700">
            Record your meeting directly in the browser. The audio will be
            processed to generate action items.
          </p>

          <div className="mb-6 space-y-4">
            {recordingStatus === "idle" && (
              <button
                onClick={handleStartRecording}
                disabled={
                  uploadStatus === "uploading" || uploadStatus === "processing"
                }
                className="flex w-full items-center justify-center rounded-lg bg-green-500 px-6 py-3 text-lg font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Mic className="mr-2 h-6 w-6" />
                Start Recording
              </button>
            )}

            {recordingStatus === "requesting_permission" && (
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
                <p className="mt-2 text-gray-600">
                  Requesting microphone access...
                </p>
              </div>
            )}

            {recordingStatus === "recording" && (
              <div className="text-center">
                <button
                  onClick={handleStopRecording}
                  className="flex w-full items-center justify-center rounded-lg bg-red-500 px-6 py-3 text-lg font-medium text-white hover:bg-red-600 transition-colors"
                >
                  <StopCircle className="mr-2 h-6 w-6" />
                  Stop Recording
                </button>
                <p className="mt-4 text-2xl font-semibold text-gray-700">
                  {formatDuration(recordingDuration)}
                </p>
                <p className="text-sm text-gray-500">
                  Recording in progress...
                </p>
              </div>
            )}

            {recordingStatus === "error" && recordingError && (
              <div className="text-center rounded-md bg-red-50 p-4 text-red-700">
                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">Recording Error</p>
                <p className="text-sm">{recordingError}</p>
                <button
                  onClick={resetToIdle}
                  className="mt-3 rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            )}

            {recordingStatus === "stopped" &&
              recordedAudioUrl &&
              recordedAudioFile && (
                <div className="space-y-4 text-center">
                  <p className="text-lg font-medium text-green-600">
                    Recording finished! Duration:{" "}
                    {formatDuration(recordingDuration)}
                  </p>
                  <audio src={recordedAudioUrl} controls className="w-full" />
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                    <button
                      onClick={handleUploadRecording}
                      disabled={
                        uploadStatus === "uploading" ||
                        uploadStatus === "processing" ||
                        uploadStatus === "success"
                      }
                      className="flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Upload className="mr-2 h-6 w-6" />
                      Upload Recording
                    </button>
                    <button
                      onClick={handleDiscardRecording}
                      disabled={
                        uploadStatus === "uploading" ||
                        uploadStatus === "processing"
                      }
                      className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="mr-2 h-6 w-6" />
                      Record Again
                    </button>
                  </div>
                </div>
              )}
          </div>

          {uploadStatus === "uploading" && (
            <div className="mb-6 text-center">
              <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin text-blue-500" />
              <p className="text-lg font-medium">Uploading recording...</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="mb-6 text-center">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">Upload successful!</p>
              <p className="text-sm text-gray-500">
                Your recording is being processed...
              </p>
            </div>
          )}

          {errorMessage &&
            (uploadStatus === "error" ||
              (uploadStatus === "idle" && recordingStatus !== "error")) && (
              <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">Operation Failed</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

          {(uploadStatus === "error" || uploadStatus === "success") && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={resetToIdle}
                className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                {uploadStatus === "error"
                  ? "Try New Recording"
                  : "Record Another Meeting"}
              </button>
            </div>
          )}
        </div>

        <div className="max-w-2xl rounded-lg bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Tips for best results:</h2>
          <ul className="ml-5 list-disc space-y-2 text-gray-700">
            <li>
              Ensure you have a working microphone and grant permission when
              prompted.
            </li>
            <li>Record in a quiet environment for better audio quality.</li>
            <li>Speak clearly and close to the microphone.</li>
            <li>
              The recording will be converted to WAV format. If conversion
              fails, the original recorded format (e.g. WebM, M4A) will be used.
            </li>
            <li>Processing time varies based on the recording length.</li>
            <li>
              For meeting recordings, encourage speakers to identify themselves
              if possible.
            </li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
