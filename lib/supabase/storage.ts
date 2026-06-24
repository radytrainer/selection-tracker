import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_STUDENT_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];

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

export function validateStudentPhotoFile(file: File): string | null {
  if (!ALLOWED_STUDENT_PHOTO_TYPES.includes(file.type)) {
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

/**
 * Uploads a student's profile photo to the private `student-documents`
 * bucket and records it as a `doc_type='photo'` row (see migration 0012).
 * Unlike the helpers above, this bucket is NOT public — a child's photo
 * tied to vulnerability data shouldn't be fetchable by anyone who ever saw
 * the URL. Returns the storage path; render it via getSignedStudentDocumentUrl.
 */
export async function uploadStudentPhoto(file: File, studentId: string): Promise<string> {
  const invalidReason = validateStudentPhotoFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${studentId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("student-documents").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("student_documents")
    .insert({ student_id: studentId, doc_type: "photo", file_path: path });
  if (insertError) throw insertError;

  return path;
}

/** Student documents live in a private bucket — callers must request a
 * short-lived signed URL rather than a public one to render an `<img>`. */
export async function getSignedStudentDocumentUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("student-documents").createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

/** Bulk variant for lists (committee queue) — one request instead of N,
 * avoiding a signed-URL waterfall per row. */
export async function getSignedStudentDocumentUrls(
  paths: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("student-documents").createSignedUrls(paths, expiresInSeconds);
  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  }
  return map;
}

/** A student can have several `doc_type='photo'` rows over time (re-uploads
 * aren't deleted) — this is "the" profile photo shown in the UI. */
export function pickLatestPhotoPath(
  documents: { doc_type: string; file_path: string; uploaded_at: string }[],
): string | null {
  const photos = documents.filter((d) => d.doc_type === "photo");
  if (photos.length === 0) return null;
  return photos.reduce((latest, d) => (d.uploaded_at > latest.uploaded_at ? d : latest)).file_path;
}
