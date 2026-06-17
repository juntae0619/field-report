"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatBytes, randomId } from "@/lib/utils";
import { type Report } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarsInput } from "@/components/stars";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "hwp", "hwpx", "ppt", "pptx", "doc", "docx",
  "xls", "xlsx", "jpg", "jpeg", "png", "gif", "zip",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface Props {
  defaultScheduleId?: string;
  defaultPropertyId?: string;
  report?: Report;
}

export function ReportForm({
  defaultScheduleId,
  defaultPropertyId,
  report,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(report);

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData(e.currentTarget);
      const scheduleId = String(fd.get("schedule_id") || "none");
      const propertyId = String(fd.get("property_id") || "none");
      const ratingRaw = String(fd.get("rating") || "0");

      const payload = {
        title: String(fd.get("title") || "").trim(),
        visit_date: String(fd.get("visit_date") || "").trim() || null,
        region: String(fd.get("region") || "").trim() || null,
        schedule_id: scheduleId === "none" ? null : scheduleId,
        property_id: propertyId === "none" ? null : propertyId,
        conclusion: String(fd.get("conclusion") || "").trim() || null,
        rating: Number(ratingRaw) || null,
      };

      if (!payload.title) {
        toast.error("제목을 입력하세요.");
        setSubmitting(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      let reportId = report?.id;

      if (isEdit && reportId) {
        const { error } = await supabase
          .from("reports")
          .update(payload)
          .eq("id", reportId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("reports")
          .insert({ ...payload, author_id: user.id })
          .select("id")
          .single();
        if (error) throw error;
        reportId = data.id;
      }

      // 파일 업로드
      for (const file of files) {
        const ext = file.name.includes(".")
          ? file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
          : "";
        const path = ext
          ? `${reportId}/${randomId()}.${ext}`
          : `${reportId}/${randomId()}`;
        const { error: upErr } = await supabase.storage
          .from("reports")
          .upload(path, file);
        if (upErr) {
          toast.error(`파일 업로드 실패: ${file.name}`);
          continue;
        }
        await supabase.from("report_files").insert({
          report_id: reportId,
          storage_path: path,
          file_name: file.name,
          file_type: file.type || null,
          file_size: file.size,
        });
      }

      toast.success(
        isEdit ? "임장보고서를 수정했습니다." : "임장보고서를 등록했습니다."
      );
      router.push(isEdit ? `/reports/${reportId}` : "/reports");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    const invalid = picked.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return !ALLOWED_EXTENSIONS.has(ext) || f.size > MAX_FILE_SIZE;
    });
    if (invalid.length > 0) {
      toast.error(
        "허용되지 않는 파일이 포함되어 있습니다. (허용: PDF, HWP, PPT, DOC, 이미지 / 최대 20MB)"
      );
      e.target.value = "";
      return;
    }
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 임장일자 · 지역 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="visit_date">임장일자</Label>
          <Input
            id="visit_date"
            name="visit_date"
            type="date"
            required
            defaultValue={report?.visit_date ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="region">지역</Label>
          <Input
            id="region"
            name="region"
            required
            defaultValue={report?.region ?? ""}
            placeholder="예) 송파구 잠실동"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={report?.title}
          placeholder="예) 잠실 헬리오시티 임장보고서"
        />
      </div>

      <input
        type="hidden"
        name="schedule_id"
        value={report?.schedule_id ?? defaultScheduleId ?? ""}
      />
      <input
        type="hidden"
        name="property_id"
        value={report?.property_id ?? defaultPropertyId ?? ""}
      />

      {/* 보고서 파일 업로드 */}
      <div className="flex flex-col gap-2">
        <Label>임장보고서 파일 (PPT / PDF / 한글 등)</Label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ash-gray py-6 text-body-sm text-smoke-gray transition-colors hover:border-sidebar-active/30 hover:bg-hint-of-sky">
          <Upload className="size-4" />
          파일 선택 또는 드래그
          <input type="file" multiple className="hidden" onChange={onFilePick} />
        </label>
        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="truncate">{f.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatBytes(f.size)}
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            기존 첨부 파일은 상세 화면에서 관리할 수 있습니다.
          </p>
        )}
      </div>

      {/* 총평/결론 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="conclusion">총평 / 결론</Label>
        <Textarea
          id="conclusion"
          name="conclusion"
          rows={5}
          defaultValue={report?.conclusion ?? ""}
          placeholder="투자/실거주 관점의 핵심 결론을 정리하세요."
        />
      </div>

      {/* 평점 */}
      <div className="flex flex-col gap-2">
        <Label>평점</Label>
        <StarsInput name="rating" defaultValue={report?.rating ?? 0} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "수정 저장" : "임장보고서 등록"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={report ? `/reports/${report.id}` : "/reports"}>취소</Link>
        </Button>
      </div>
    </form>
  );
}
