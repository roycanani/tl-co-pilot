"use client";

import { useRef, useState, DragEvent } from "react";
import { Upload, FileAudio } from "lucide-react";

interface AudioDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  disabled: boolean;
}

export default function AudioDropzone({
  onFileSelected,
  selectedFile,
  disabled,
}: AudioDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Define valid audio types
  const validAudioTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
  ];

  // Handle file selection through input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  // Validate file type and size
  const validateAndSelectFile = (file: File) => {
    // Check file type - now accepting MP3 and WAV
    if (!validAudioTypes.some((type) => file.type.includes(type))) {
      alert("Please select an MP3 or WAV file");
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit");
      return;
    }

    onFileSelected(file);
  };

  // Trigger file input click
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Get file type display name
  const getFileTypeName = (file: File) => {
    if (file.type.includes("audio/mp3") || file.type.includes("audio/mpeg")) {
      return "MP3";
    } else if (file.type.includes("wav")) {
      return "WAV";
    }
    return file.type;
  };

  return (
    <div
      onClick={openFileDialog}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
        ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50"
            : "border-blue-300 hover:border-blue-500"
        }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav"
        disabled={disabled}
        className="hidden"
      />

      {selectedFile ? (
        <div className="text-center">
          <FileAudio className="mx-auto mb-2 h-10 w-10 text-blue-500" />
          <p className="text-lg font-medium">{selectedFile.name}</p>
          <p className="text-sm text-gray-500">
            {getFileTypeName(selectedFile)} •{" "}
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="mx-auto mb-2 h-10 w-10 text-blue-500" />
          <p className="text-lg font-medium">
            {isDragging
              ? "Drop audio file here"
              : "Click to select an audio file"}
          </p>
          <p className="text-sm text-gray-500">MP3 or WAV format</p>
        </div>
      )}
    </div>
  );
}
