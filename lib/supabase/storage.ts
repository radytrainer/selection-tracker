import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Logo must be a PNG, JPEG, WebP, or SVG image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Logo must be 2MB or smaller.";
  }
  return null;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Photo must be a PNG, JPEG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Photo must be 2MB or smaller.";
  }
  return null;
}

async function uploadToBucket(bucket: string, path: string, file: File): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Uploads a partner logo to the public `partner-logos` bucket under a
 * random filename and returns its public URL (see migration 0007). */
export async function uploadPartnerLogo(file: File, kind: "ngos" | "schools"): Promise<string> {
  const invalidReason = validateLogoFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const ext = file.name.split(".").pop() || "png";
  return uploadToBucket("partner-logos", `${kind}/${crypto.randomUUID()}.${ext}`, file);
}

/** Uploads a user's profile photo to the public `avatars` bucket under their
 * own Firebase UID folder and returns its public URL (see migration 0008). */
export async function uploadAvatar(file: File, firebaseUid: string): Promise<string> {
  const invalidReason = validateAvatarFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const ext = file.name.split(".").pop() || "png";
  return uploadToBucket("avatars", `${firebaseUid}/${crypto.randomUUID()}.${ext}`, file);
}
