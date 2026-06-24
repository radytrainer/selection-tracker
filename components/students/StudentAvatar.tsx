"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { getSignedStudentDocumentUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

/**
 * Renders a student's photo, or an initials circle if none is set yet.
 * Photos live in a private bucket (see migration 0012), so they're never
 * rendered from a plain public URL — pass either a pre-resolved `signedUrl`
 * (bulk-loaded lists, to avoid one signed-URL request per row) or just
 * `photoPath` to have this component fetch its own signed URL.
 */
export function StudentAvatar({
  photoPath,
  signedUrl,
  initials,
  size = "size-10",
  className,
}: {
  photoPath: string | null;
  signedUrl?: string | null;
  initials: string;
  size?: string;
  className?: string;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(signedUrl ?? null);

  useEffect(() => {
    if (signedUrl !== undefined) {
      setResolvedUrl(signedUrl);
      return;
    }
    if (!photoPath) {
      setResolvedUrl(null);
      return;
    }
    let cancelled = false;
    getSignedStudentDocumentUrl(photoPath).then((url) => {
      if (!cancelled) setResolvedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photoPath, signedUrl]);

  if (resolvedUrl) {
    // Signed URLs carry a per-request token and an expiry — not a stable
    // asset next/image can cache/optimize, so a plain <img> is the right call.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedUrl} alt="" className={cn(size, "shrink-0 rounded-full object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className,
      )}
    >
      {initials || <User className="size-1/2" />}
    </div>
  );
}
