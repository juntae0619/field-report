"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function resetMemberPassword(
  profileId: string
): Promise<{ ok: boolean; password?: string; error?: string }> {
  await requireAdmin();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "서버에 SERVICE_ROLE 키가 설정되지 않았습니다." };
  }
  const tempPassword = randomBytes(12).toString("base64url");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, {
    password: tempPassword,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, password: tempPassword };
}

export async function updateMember(formData: FormData) {
  const currentProfile = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("profile_id"));
  const role = String(formData.get("role"));
  const cohortRaw = String(formData.get("cohort"));
  const cohort = cohortRaw === "none" ? null : cohortRaw;

  if (!["admin", "member"].includes(role)) return;
  if (cohort !== null && !["weekday", "weekend"].includes(cohort)) return;
  if (id === currentProfile.id && role !== "admin") return;

  await supabase
    .from("profiles")
    .update({ role, cohort })
    .eq("id", id);

  revalidatePath("/members");
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name")).trim();
  const cohort = String(formData.get("cohort"));
  if (!name || name.length > 100 || !["weekday", "weekend"].includes(cohort)) return;

  await supabase.from("groups").insert({ name, cohort });
  revalidatePath("/members");
}

export async function deleteGroup(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("group_id"));
  await supabase.from("groups").delete().eq("id", id);
  revalidatePath("/members");
}

export async function assignMember(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const group_id = String(formData.get("group_id"));
  const profile_id = String(formData.get("profile_id"));
  if (!profile_id || profile_id === "none") return;

  await supabase
    .from("group_members")
    .insert({ group_id, profile_id });
  revalidatePath("/members");
}

export async function updateGroupLeader(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const groupId = String(formData.get("group_id"));
  const leaderRaw = String(formData.get("leader_id") ?? "none");
  const leaderId = leaderRaw === "none" ? null : leaderRaw;

  if (leaderId) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", leaderId)
      .maybeSingle();
    if (!membership) return;
  }

  await supabase.from("groups").update({ leader_id: leaderId }).eq("id", groupId);
  revalidatePath("/members");
}

export async function removeMember(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const group_id = String(formData.get("group_id"));
  const profile_id = String(formData.get("profile_id"));

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", group_id)
    .eq("profile_id", profile_id);
  await supabase
    .from("groups")
    .update({ leader_id: null })
    .eq("id", group_id)
    .eq("leader_id", profile_id);
  revalidatePath("/members");
}
