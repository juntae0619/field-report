"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function createMemo(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim() || null;
  if (!title && !content) return;

  await supabase.from("memos").insert({
    owner_id: profile.id,
    title: title || "(제목 없음)",
    content,
  });
  revalidatePath("/memos");
}

export async function updateMemo(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim() || null;

  await supabase
    .from("memos")
    .update({ title: title || "(제목 없음)", content })
    .eq("id", id);
  revalidatePath("/memos");
}

export async function deleteMemo(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("memos").delete().eq("id", id);
  revalidatePath("/memos");
}
