"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatBytes, randomId } from "@/lib/utils";
import { type Property, type Report, type Schedule } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarsInput } from "@/components/stars";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "hwp", "hwpx", "ppt", "pptx", "doc", "docx",
  "xls", "xlsx", "jpg", "jpeg", "png", "gif", "zip",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface Props {
  defaultScheduleId?: string;
  defaultPropertyId?: string;
  report?: Report;
  schedules: Pick<Schedule, "id" | "title" | "visit_date">[];
  properties: Pick<Property, "id" | "name" | "region">[];
}

export function ReportForm({
  defaultScheduleId,
  defaultPropertyId,
  report,
  schedules,
  properties,
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

      const ratingValue = Number(ratingRaw);
      const payload = {
        title: String(fd.get("title") || "").trim(),
        visit_date: String(fd.get("visit_date") || "").trim() || null,
        region: String(fd.get("region") || "").trim() || null,
        schedule_id: scheduleId === "none" ? null : scheduleId,
        property_id: propertyId === "none" ? null : propertyId,
        summary: String(fd.get("summary") || "").trim() || null,
        location_review: String(fd.get("location_review") || "").trim() || null,
        price_review: String(fd.get("price_review") || "").trim() || null,
        pros: String(fd.get("pros") || "").trim() || null,
        cons: String(fd.get("cons") || "").trim() || null,
        conclusion: String(fd.get("conclusion") || "").trim() || null,
        rating:
          Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5
            ? ratingValue
            : null,
      };

      if (!payload.title || payload.title.length > 200) {
        toast.error("제목을 1자 이상 200자 이하로 입력하세요.");
        return;
      }
      if (!payload.visit_date || !payload.region) {
        toast.error("임장일자와 지역을 입력하세요.");
        return;
      }
      const sections = [payload.summary, payload.location_review, payload.price_review, payload.pros, payload.cons, payload.conclusion];
      if (sections.some((value) => value && value.length > 10000)) {
        toast.error("각 분석 항목은 10,000자 이하로 입력하세요.");
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
        const { error: recordError } = await supabase.from("report_files").insert({
          report_id: reportId,
          storage_path: path,
          file_name: file.name,
          file_type: file.type || null,
          file_size: file.size,
        });
        if (recordError) {
          await supabase.storage.from("reports").remove([path]);
          toast.error(`파일 정보 저장 실패: ${file.name}`);
        }
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
          maxLength={200}
          defaultValue={report?.title}
          placeholder="예) 잠실 헬리오시티 임장보고서"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="summary">물건 개요·임장 목적</Label>
        <Textarea id="summary" name="summary" rows={4} maxLength={10000} defaultValue={report?.summary ?? ""} placeholder="물건 기본 정보, 임장 목적, 사전 확인 사항을 정리하세요." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location_review">입지·생활권 분석</Label>
        <Textarea id="location_review" name="location_review" rows={5} maxLength={10000} defaultValue={report?.location_review ?? ""} placeholder="교통, 상권, 학군, 일자리, 환경, 개발 호재와 현장 분위기를 기록하세요." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="price_review">가격·시세·수익성 분석</Label>
        <Textarea id="price_review" name="price_review" rows={5} maxLength={10000} defaultValue={report?.price_review ?? ""} placeholder="매매·전월세 시세, 실거래가, 경공매 최저가, 예상 수익과 비용을 기록하세요." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pros">장점·기회요인</Label>
          <Textarea id="pros" name="pros" rows={4} maxLength={10000} defaultValue={report?.pros ?? ""} placeholder="현장에서 확인한 강점과 투자 기회를 적어주세요." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cons">단점·위험요인</Label>
          <Textarea id="cons" name="cons" rows={4} maxLength={10000} defaultValue={report?.cons ?? ""} placeholder="소음, 경사, 공실, 권리·수선 위험 등 주의점을 적어주세요." />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>연결 일정</Label>
          <Select name="schedule_id" defaultValue={report?.schedule_id ?? defaultScheduleId ?? "none"}>
            <SelectTrigger><SelectValue placeholder="일정 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">연결하지 않음</SelectItem>
              {schedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.visit_date} · {schedule.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>연결 물건</Label>
          <Select name="property_id" defaultValue={report?.property_id ?? defaultPropertyId ?? "none"}>
            <SelectTrigger><SelectValue placeholder="물건 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">연결하지 않음</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}{property.region ? ` · ${property.region}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 보고서 파일 업로드 */}
      <div className="flex flex-col gap-2">
        <Label>임장보고서 파일 (PPT / PDF / 한글 등)</Label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ash-gray py-6 text-body-sm text-smoke-gray transition-colors hover:border-sidebar-active/30 hover:bg-hint-of-sky">
          <Upload className="size-4" />
          파일 선택 또는 드래그
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.hwp,.hwpx,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip"
            onChange={onFilePick}
          />
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
                    aria-label={`${f.name} 선택 해제`}
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
