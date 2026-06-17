import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Pencil, Plus } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  COHORT_LABEL,
  SCHEDULE_STATUS_LABEL,
  type Cohort,
  type Schedule,
  type ScheduleStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSchedule } from "../actions";

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("schedules")
    .select("*, group:groups(name)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const schedule = data as Schedule & { group: { name: string } | null };

  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, created_at, author:profiles(name)")
    .eq("schedule_id", id)
    .order("created_at", { ascending: false });

  const isAdmin = profile.role === "admin";

  return (
    <div>
      <PageHeader
        title={schedule.title}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/schedules/${id}/edit`}>
                  <Pencil className="size-4" /> 수정
                </Link>
              </Button>
              <form action={deleteSchedule}>
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
        <Badge variant="outline">{COHORT_LABEL[schedule.cohort as Cohort]}</Badge>
        {schedule.group && <Badge variant="secondary">{schedule.group.name}</Badge>}
        <Badge variant={schedule.status === "done" ? "secondary" : "default"}>
          {SCHEDULE_STATUS_LABEL[schedule.status as ScheduleStatus]}
        </Badge>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{formatDate(schedule.visit_date)}</span>
        {schedule.region && (
          <span className="flex items-center gap-1">
            <MapPin className="size-4" /> {schedule.region}
          </span>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>임장 계획</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.plan ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {schedule.plan}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              등록된 계획이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>관련 임장보고서</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/reports/new?schedule=${id}`}>
              <Plus className="size-4" /> 임장보고서 작성
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(reports?.length ?? 0) === 0 && (
            <EmptyStateCompact title="아직 임장보고서가 없습니다." />
          )}
          {reports?.map((r) => {
            const author = r.author as unknown as { name: string } | null;
            return (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover-row"
              >
                <span className="font-medium">{r.title}</span>
                <span className="text-xs text-muted-foreground">
                  {author?.name} · {formatDate(r.created_at)}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
