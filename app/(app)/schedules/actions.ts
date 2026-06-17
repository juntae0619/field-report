"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function parse(formData: FormData) {
  const group_id_raw = String(formData.get("group_id") ?? "none");
  return {
    title: String(formData.get("title") ?? "").trim(),
    visit_date: String(formData.get("visit_date") ?? ""),
    cohort: String(formData.get("cohort") ?? "weekday"),
    group_id: group_id_raw === "none" ? null : group_id_raw,
    region: String(formData.get("region") ?? "").trim() || null,
    plan: String(formData.get("plan") ?? "").trim() || null,
    status: String(formData.get("status") ?? "planned"),
  };
}

export async function createSchedule(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const values = parse(formData);

  const { data, error } = await supabase
    .from("schedules")
    .insert({ ...values, created_by: profile.id })
    .select("id")
    .single();

  if (error) {
    redirect(`/schedules/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/schedules");
  redirect(`/schedules/${data!.id}`);
}

export async function updateSchedule(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const values = parse(formData);

  await supabase.from("schedules").update(values).eq("id", id);

  revalidatePath("/schedules");
  revalidatePath(`/schedules/${id}`);
  redirect(`/schedules/${id}`);
}

export async function deleteSchedule(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("schedules").delete().eq("id", id);
  revalidatePath("/schedules");
  redirect("/schedules");
}
