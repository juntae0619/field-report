import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  if (error) {
    console.error("[auth:profile-read]", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    return null;
  }

  const fallbackName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : user.email?.split("@")[0] ?? "";

  const { data: repairedProfile, error: repairError } = await supabase
    .from("profiles")
    .insert({ id: user.id, name: fallbackName, email: user.email ?? null })
    .select("*")
    .single();

  if (repairError) {
    console.error("[auth:profile-repair]", {
      code: repairError.code,
      message: repairError.message,
      userId: user.id,
    });
    return null;
  }

  return repairedProfile as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
