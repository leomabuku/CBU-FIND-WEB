const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

import { ChatAttachment, MessageMediaType } from "./types";

export const CHAT_MEDIA_MAX_BYTES = 20 * 1024 * 1024;

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the selected image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress this image."))),
      "image/jpeg",
      0.84,
    );
  });
}

export async function uploadImage(file: File, userId: string, kind: "reports" | "profile") {
  if (!cloudName || !uploadPreset) {
    throw new Error("Image uploads are not configured. Add the Cloudinary public settings.");
  }
  const body = new FormData();
  body.append("file", await compressImage(file), `cbu-find-${crypto.randomUUID()}.jpg`);
  body.append("upload_preset", uploadPreset);
  body.append("context", `app=cbu_find|uploaded_by=${userId}|kind=${kind}`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary could not upload this image.");
  }
  return payload.secure_url;
}

export async function uploadChatMedia(file: File, userId: string): Promise<ChatAttachment> {
  if (!cloudName || !uploadPreset) {
    throw new Error("Media uploads are not configured. Add the Cloudinary public settings.");
  }
  if (file.size > CHAT_MEDIA_MAX_BYTES) {
    throw new Error("Chat attachments must be 20 MB or smaller.");
  }

  const mediaType: MessageMediaType = file.type.startsWith("image/")
    ? "IMAGE"
    : file.type.startsWith("video/")
      ? "VIDEO"
      : "FILE";
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("context", `app=cbu_find|uploaded_by=${userId}|kind=messages`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body,
  });
  const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary could not upload this attachment.");
  }
  return {
    url: payload.secure_url,
    type: mediaType,
    name: file.name || "Attachment",
    sizeBytes: file.size,
  };
}
