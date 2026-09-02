"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function deleteReport(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const { data: report } = await supabase
    .from("reports")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (!report || (profile.role !== "admin" && report.author_id !== profile.id)) return;

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
  const profile = await requireProfile();
  const supabase = await createClient();
  const fileId = String(formData.get("file_id"));
  const reportId = String(formData.get("report_id"));

  const { data: report } = await supabase
    .from("reports")
    .select("author_id")
    .eq("id", reportId)
    .maybeSingle();
  if (!report || (profile.role !== "admin" && report.author_id !== profile.id)) return;

  // storage_path를 사용자 입력에서 받지 않고 DB에서 조회
  const { data: fileRecord } = await supabase
    .from("report_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("report_id", reportId)
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
  const ratingRaw = Number(String(formData.get("rating") ?? "0"));
  const rating = Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  if (!content || content.length > 2000) return;

  await supabase.from("feedbacks").insert({
    report_id: reportId,
    author_id: profile.id,
    content,
    rating,
  });
  revalidatePath(`/reports/${reportId}`);
}

export async function deleteFeedback(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("feedback_id"));
  const reportId = String(formData.get("report_id"));
  const { data: feedback } = await supabase
    .from("feedbacks")
    .select("author_id, report_id")
    .eq("id", id)
    .maybeSingle();
  if (
    !feedback ||
    feedback.report_id !== reportId ||
    (profile.role !== "admin" && feedback.author_id !== profile.id)
  ) return;

  await supabase.from("feedbacks").delete().eq("id", id);
  revalidatePath(`/reports/${reportId}`);
}
