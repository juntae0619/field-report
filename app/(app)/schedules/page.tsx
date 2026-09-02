import Link from "next/link";
import { Clock, Plus, MapPin, Search } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  COHORT_LABEL,
  SCHEDULE_STATUS_LABEL,
  type Cohort,
  type Schedule,
  type ScheduleStatus,
} from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScheduleCohortTabs } from "./schedule-cohort-tabs";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; q?: string; status?: string }>;
}) {
  const profile = await requireProfile();
  const { cohort = "all", q = "", status = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("schedules")
    .select("*")
    .order("visit_date", { ascending: false })
    .limit(100);
  if (cohort === "weekday" || cohort === "weekend") {
    query = query.eq("cohort", cohort);
  }
  if (["planned", "done", "canceled"].includes(status)) {
    query = query.eq("status", status);
  }
  const term = q.replace(/[%,()]/g, " ").trim();
  if (term) {
    query = query.or(`title.ilike.%${term}%,region.ilike.%${term}%,meeting_place.ilike.%${term}%`);
  }
  const { data } = await query;
  const schedules = (data ?? []) as Schedule[];

  return (
    <div>
      <PageHeader
        title="일정 관리"
        description="반·조별 임장 일정과 발표 일정을 확인하세요."
        action={
          profile.role === "admin" ? (
            <Button asChild>
              <Link href="/schedules/new">
                <Plus className="size-4" /> 새 일정
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ScheduleCohortTabs cohort={cohort} />

      <form className="mb-5 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_150px_auto_auto]">
        <input type="hidden" name="cohort" value={cohort} />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="일정명, 지역, 집결 장소" className="pl-9" />
        </div>
        <select name="status" defaultValue={status} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="all">전체 상태</option>
          <option value="planned">예정</option>
          <option value="done">완료</option>
          <option value="canceled">취소</option>
        </select>
        <Button type="submit" variant="outline">검색</Button>
        {(q || status !== "all") && <Button variant="ghost" asChild><Link href={`/schedules?cohort=${cohort}`}>초기화</Link></Button>}
      </form>

      {schedules.length === 0 ? (
        <EmptyState
          title="등록된 일정이 없습니다"
          description={
            profile.role === "admin"
              ? "새 일정을 등록해 임장 계획을 공유하세요."
              : "운영자가 일정을 등록하면 여기에 표시됩니다."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.map((s) => (
            <Link key={s.id} href={`/schedules/${s.id}`}>
              <Card className="py-4 hover-row">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{s.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke-gray">
                      <span>{formatDate(s.visit_date)}{s.visit_time ? ` ${formatTime(s.visit_time)}` : ""}</span>
                      {s.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {s.region}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      {COHORT_LABEL[s.cohort as Cohort]}
                    </Badge>
                    <Badge
                      variant={
                        s.status === "done"
                          ? "secondary"
                          : s.status === "canceled"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {SCHEDULE_STATUS_LABEL[s.status as ScheduleStatus]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
