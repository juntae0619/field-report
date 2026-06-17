"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function deleteReport(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  // 첨부 파일 스토리지 정리
  const { data: files } = await supabase
    .from("report_files")
    .select("storage_path")
    .eq("report_id", id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("reports")
      .remove(files.map((f) => f.storage_path));
  }

  await supabase.from("reports").delete().eq("id", id);
  revalidatePath("/reports");
  redirect("/reports");
}

export async function deleteReportFile(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const fileId = String(formData.get("file_id"));
  const reportId = String(formData.get("report_id"));

  // storage_path를 사용자 입력에서 받지 않고 DB에서 조회 (RLS가 소유권 검증)
  const { data: fileRecord } = await supabase
    .from("report_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (!fileRecord) return;

  // DB 레코드 먼저 삭제 후 Storage 삭제 (DB 실패 시 Storage 파일 보존)
  await supabase.from("report_files").delete().eq("id", fileId);
  await supabase.storage.from("reports").remove([fileRecord.storage_path]);
  revalidatePath(`/reports/${reportId}`);
}

export async function addFeedback(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const reportId = String(formData.get("report_id"));
  const content = String(formData.get("content") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "0");
  if (!content) return;

  await supabase.from("feedbacks").insert({
    report_id: reportId,
    author_id: profile.id,
    content,
    rating: Number(ratingRaw) || null,
  });
  revalidatePath(`/reports/${reportId}`);
}

export async function deleteFeedback(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("feedback_id"));
  const reportId = String(formData.get("report_id"));

  await supabase.from("feedbacks").delete().eq("id", id);
  revalidatePath(`/reports/${reportId}`);
}
