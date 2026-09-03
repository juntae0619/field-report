"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function parse(formData: FormData) {
  const group_id_raw = String(formData.get("group_id") ?? "none");
  const typeRaw = String(formData.get("type") ?? "visit");
  const type = ["visit", "presentation"].includes(typeRaw) ? typeRaw : "visit";
  const status = String(formData.get("status") ?? "planned");
  return {
    title: String(formData.get("title") ?? "").trim(),
    visit_date: String(formData.get("visit_date") ?? ""),
    visit_time: /^\d{2}:\d{2}$/.test(String(formData.get("visit_time") ?? ""))
      ? String(formData.get("visit_time"))
      : null,
    cohort: type === "presentation"
      ? null
      : ["weekday", "weekend"].includes(String(formData.get("cohort")))
        ? String(formData.get("cohort"))
        : "weekday",
    group_id: type === "presentation" || group_id_raw === "none" ? null : group_id_raw,
    region: String(formData.get("region") ?? "").trim() || null,
    meeting_place: String(formData.get("meeting_place") ?? "").trim() || null,
    plan: String(formData.get("plan") ?? "").trim() || null,
    type,
    status: ["planned", "done", "canceled"].includes(status) ? status : "planned",
  };
}

export async function createSchedule(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const values = parse(formData);
  if (!values.title || values.title.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(values.visit_date)) {
    redirect(`/schedules/new?error=${encodeURIComponent("제목과 날짜를 올바르게 입력해주세요.")}`);
  }

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
  if (!values.title || values.title.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(values.visit_date)) {
    redirect(`/schedules/${id}/edit?error=${encodeURIComponent("제목과 날짜를 올바르게 입력해주세요.")}`);
  }

  const { error } = await supabase.from("schedules").update(values).eq("id", id);
  if (error) {
    redirect(`/schedules/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

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
