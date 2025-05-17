"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";
import { ImageIcon, UploadIcon, XIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  onMultipleImagesUploaded?: (urls: string[]) => void;
  existingImageUrl?: string;
  existingImageUrls?: string[];
  folder?: string;
  maxSizeMB?: number;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
}

type FileWithPreview = {
  file: File;
  preview: string;
};

export function ImageUploader({
  onImageUploaded,
  onMultipleImagesUploaded,
  existingImageUrl,
  existingImageUrls = [],
  folder = "images",
  maxSizeMB = 5,
  maxFiles = 5,
  className = "",
  multiple = false,
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    existingImageUrl || null
  );
  const [imageUrls, setImageUrls] = useState<string[]>(existingImageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filesToUpload, setFilesToUpload] = useState<FileWithPreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const supabase = createClient();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  // Handle file drop with react-dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Limit the number of files that can be uploaded at once
      const filesToProcess = multiple
        ? acceptedFiles.slice(0, maxFiles)
        : [acceptedFiles[0]];

      console.log(`Processing ${filesToProcess.length} files for upload`);

      // Create previews for the files
      const filesWithPreview = filesToProcess.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      if (multiple) {
        setFilesToUpload((prevFiles) => [...prevFiles, ...filesWithPreview]);
      } else {
        setFilesToUpload([filesWithPreview[0]]);
      }
    },
    [multiple, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    maxSize: maxSizeBytes,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  // Handle uploading all files in the queue
  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const uploadedUrls: string[] = [];
    let progressIncrement = 100 / filesToUpload.length;

    try {
      console.log(
        `Starting upload of ${filesToUpload.length} files to folder: ${folder}`
      );

      for (let i = 0; i < filesToUpload.length; i++) {
        const { file } = filesToUpload[i];

        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        console.log(
          `Uploading file ${i + 1}/${filesToUpload.length}: ${filePath}`
        );

        // Upload the file to Supabase Storage
        const { data: uploadData, error } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        console.log(`File ${i + 1} uploaded successfully, getting public URL`);

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        const publicUrl = urlData?.publicUrl;

        if (publicUrl) {
          console.log(`Got public URL: ${publicUrl}`);
          uploadedUrls.push(publicUrl);
          setUploadProgress((i + 1) * progressIncrement);

          // If single file upload, set the imageUrl and call the callback
          if (!multiple) {
            setImageUrl(publicUrl);
            onImageUploaded(publicUrl);
            break; // Exit after first upload for single file mode
          }
        }
      }

      // Handle multiple file mode callbacks after all uploads complete
      if (multiple) {
        // Combine existing and newly uploaded URLs
        const allUrls = [...imageUrls, ...uploadedUrls];
        console.log(`Multiple upload complete. Total URLs: ${allUrls.length}`);
        setImageUrls(allUrls);

        if (onMultipleImagesUploaded) {
          console.log("Calling onMultipleImagesUploaded with all URLs");
          onMultipleImagesUploaded(uploadedUrls);
        } else {
          // If no multiple callback provided, call single callback for each URL
          console.log(
            "No onMultipleImagesUploaded callback, calling onImageUploaded for each URL"
          );
          uploadedUrls.forEach((url) => onImageUploaded(url));
        }
      }

      // Clear the upload queue after successful upload
      setFilesToUpload([]);
    } catch (error: any) {
      console.error("Error uploading image(s):", error);
      setUploadError(error.message || "Error uploading image(s)");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Cancel uploads and remove previews
  const cancelUploads = () => {
    filesToUpload.forEach((file) => URL.revokeObjectURL(file.preview));
    setFilesToUpload([]);
  };

  // Handle removing a single image (from uploaded or existing images)
  const handleRemoveImage = (url: string) => {
    if (multiple) {
      const updatedUrls = imageUrls.filter((imageUrl) => imageUrl !== url);
      setImageUrls(updatedUrls);
      if (onMultipleImagesUploaded) {
        onMultipleImagesUploaded(updatedUrls);
      }
    } else {
      setImageUrl(null);
      onImageUploaded("");
    }
  };

  // Handle removing a file from the upload queue
  const handleRemoveFileFromQueue = (index: number) => {
    URL.revokeObjectURL(filesToUpload[index].preview);
    const updatedFiles = [...filesToUpload];
    updatedFiles.splice(index, 1);
    setFilesToUpload(updatedFiles);
  };

  return (
    <div className={`space-y-4 my-6 ${className}`}>
      {/* Main dropzone area */}
      {(!imageUrl || multiple) && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all
            ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
            }`}
          style={{ minHeight: "180px" }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='h-8 w-8 text-primary animate-spin' />
              <p className='text-sm font-medium text-muted-foreground'>
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-2'>
              <div className='p-3 rounded-full bg-muted'>
                <ImageIcon className='h-6 w-6 text-muted-foreground' />
              </div>
              <p className='text-sm text-center font-medium text-foreground'>
                {multiple
                  ? `Drag & drop up to ${maxFiles} images here`
                  : "Drag & drop an image here"}
              </p>
              <p className='text-xs text-center text-muted-foreground'>
                Or click to browse your files (max size: {maxSizeMB}MB)
              </p>
              {uploadError && (
                <p className='text-xs text-destructive font-medium mt-1'>
                  {uploadError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Single image display */}
      {!multiple && imageUrl && (
        <div
          className='relative border rounded-lg overflow-hidden bg-muted/20 shadow-sm'
          style={{ height: "240px" }}
        >
          <img
            src={imageUrl}
            alt='Uploaded image'
            className='h-full w-full object-contain'
          />
          <div className='absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100'>
            <div className='flex gap-2'>
              <Button
                size='sm'
                {...getRootProps()}
                disabled={uploading}
                className='bg-black/70 hover:bg-black/90'
              >
                <UploadIcon className='mr-2 h-4 w-4' />
                Change
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={() => handleRemoveImage(imageUrl)}
                disabled={uploading}
                className='bg-destructive/80 hover:bg-destructive'
              >
                <XIcon className='mr-2 h-4 w-4' />
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multiple images grid display */}
      {multiple && imageUrls.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className='relative border rounded-lg overflow-hidden bg-muted/20 shadow-sm aspect-square'
            >
              <img
                src={url}
                alt={`Uploaded image ${index + 1}`}
                className='h-full w-full object-cover'
              />
              <div className='absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100'>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => handleRemoveImage(url)}
                  disabled={uploading}
                  className='h-8 w-8 p-0 rounded-full'
                >
                  <XIcon className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files to upload preview */}
      {filesToUpload.length > 0 && (
        <div className='space-y-4'>
          <h3 className='text-sm font-medium text-foreground'>
            Ready to upload {filesToUpload.length}{" "}
            {filesToUpload.length === 1 ? "file" : "files"}
          </h3>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            {filesToUpload.map((file, index) => (
              <div
                key={index}
                className='relative border rounded-lg overflow-hidden bg-muted/20 shadow-sm aspect-square'
              >
                <Image
                  width={200}
                  height={200}
                  src={file.preview}
                  alt={`Preview ${index + 1}`}
                  className='h-full w-full object-cover'
                />
                <div className='absolute top-2 right-2'>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleRemoveFileFromQueue(index)}
                    className='h-6 w-6 p-0 rounded-full bg-black/70 hover:bg-black/90 border border-white/20'
                    disabled={uploading}
                  >
                    <XIcon className='h-3 w-3' />
                  </Button>
                </div>
                <div className='absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-2 truncate'>
                  <p className='text-xs text-white/90 truncate'>
                    {file.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className='flex gap-2 justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={cancelUploads}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type='button'
              size='sm'
              onClick={uploadFiles}
              disabled={uploading}
              className='flex items-center'
            >
              {uploading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className='mr-2 h-4 w-4' />
                  Upload {filesToUpload.length}{" "}
                  {filesToUpload.length === 1 ? "file" : "files"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
