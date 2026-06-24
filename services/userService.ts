import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export async function getMyProfile(firebaseUid: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateMyProfile(
  firebaseUid: string,
  values: { full_name: string; phone: string | null; avatar_url: string | null },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("users").update(values).eq("firebase_uid", firebaseUid);
  if (error) throw error;
}
