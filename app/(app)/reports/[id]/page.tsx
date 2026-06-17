import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, FileText, MapPin, Pencil } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatBytes } from "@/lib/utils";
import { type Feedback, type Report, type ReportFile } from "@/lib/types";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarsDisplay } from "@/components/stars";
import { FeedbackForm } from "./feedback-form";
import { deleteReport, deleteReportFile, deleteFeedback } from "../actions";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select(
      "*, author:profiles(id, name), schedule:schedules(id, title), property:properties(id, name)"
    )
    .eq("id", id)
    .single();

  if (!data) notFound();
  const report = data as Report & {
    author: { id: string; name: string } | null;
    schedule: { id: string; title: string } | null;
    property: { id: string; name: string } | null;
  };

  const [{ data: files }, { data: feedbacks }] = await Promise.all([
    supabase
      .from("report_files")
      .select("*")
      .eq("report_id", id)
      .order("created_at"),
    supabase
      .from("feedbacks")
      .select("*, author:profiles(id, name)")
      .eq("report_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // 비공개 버킷 → 서명 URL 생성
  const fileList = (files ?? []) as ReportFile[];
  const signed = await Promise.all(
    fileList.map(async (f) => {
      const { data: url } = await supabase.storage
        .from("reports")
        .createSignedUrl(f.storage_path, 60 * 60);
      return { file: f, url: url?.signedUrl ?? "#" };
    })
  );

  const canEdit = profile.role === "admin" || report.author_id === profile.id;

  // 이전 양식으로 작성된 보고서의 상세 내용(있을 때만 표시)
  const legacySections: { label: string; value: string | null }[] = [
    { label: "물건 개요", value: report.summary },
    { label: "입지 분석", value: report.location_review },
    { label: "가격/시세", value: report.price_review },
    { label: "장점", value: report.pros },
    { label: "단점", value: report.cons },
  ];
  const hasLegacy = legacySections.some((s) => s.value);

  return (
    <div>
      <PageHeader
        title={report.title}
        action={
          canEdit ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/reports/${id}/edit`}>
                  <Pencil className="size-4" /> 수정
                </Link>
              </Button>
              <form action={deleteReport}>
                <input type="hidden" name="id" value={id} />
                <Button variant="destructive" type="submit">
                  삭제
                </Button>
              </form>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {report.visit_date && (
          <Badge variant="outline" className="gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(report.visit_date)}
          </Badge>
        )}
        {report.region && (
          <Badge variant="secondary" className="gap-1">
            <MapPin className="size-3.5" />
            {report.region}
          </Badge>
        )}
        {report.property && (
          <Link href={`/properties/${report.property.id}`}>
            <Badge variant="outline">{report.property.name}</Badge>
          </Link>
        )}
        {report.schedule && (
          <Link href={`/schedules/${report.schedule.id}`}>
            <Badge variant="outline">{report.schedule.title}</Badge>
          </Link>
        )}
        <StarsDisplay value={report.rating} />
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {report.author?.name} · {formatDate(report.created_at, true)}
      </p>

      {/* 임장보고서 파일 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>임장보고서 파일</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {signed.length === 0 && (
            <p className="text-sm text-muted-foreground">첨부된 파일이 없습니다.</p>
          )}
          {signed.map(({ file, url }) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{file.file_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {file.file_size ? formatBytes(file.file_size) : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <a href={url} target="_blank" rel="noreferrer" download>
                    <Download className="size-4" />
                  </a>
                </Button>
                {canEdit && (
                  <form action={deleteReportFile}>
                    <input type="hidden" name="file_id" value={file.id} />
                    <input type="hidden" name="report_id" value={id} />
                    <input
                      type="hidden"
                      name="storage_path"
                      value={file.storage_path}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      type="submit"
                      className="text-muted-foreground"
                    >
                      삭제
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 총평/결론 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>총평 / 결론</CardTitle>
        </CardHeader>
        <CardContent>
          {report.conclusion ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {report.conclusion}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              작성된 총평이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 이전 양식 상세 내용 (있을 때만) */}
      {hasLegacy && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>상세 내용</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {legacySections.map(
              (s) =>
                s.value && (
                  <div key={s.label}>
                    <h3 className="mb-1 text-sm font-semibold text-muted-foreground">
                      {s.label}
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {s.value}
                    </p>
                  </div>
                )
            )}
          </CardContent>
        </Card>
      )}

      {/* 피드백 */}
      <Card>
        <CardHeader>
          <CardTitle>
            피드백{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({feedbacks?.length ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FeedbackForm reportId={id} />
          <Separator />
          <div className="flex flex-col gap-3">
            {(feedbacks?.length ?? 0) === 0 && (
              <EmptyStateCompact title="아직 피드백이 없습니다." />
            )}
            {(feedbacks as (Feedback & { author: { id: string; name: string } | null })[] | null)?.map(
              (f) => {
                const canDelete =
                  profile.role === "admin" || f.author_id === profile.id;
                return (
                  <div key={f.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {f.author?.name}
                        </span>
                        <StarsDisplay value={f.rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(f.created_at, true)}
                        </span>
                        {canDelete && (
                          <form action={deleteFeedback}>
                            <input
                              type="hidden"
                              name="feedback_id"
                              value={f.id}
                            />
                            <input type="hidden" name="report_id" value={id} />
                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              삭제
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{f.content}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
