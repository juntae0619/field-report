import Link from "next/link";
import { Plus, MapPin } from "lucide-react";

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
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleCohortTabs } from "./schedule-cohort-tabs";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const profile = await requireProfile();
  const { cohort = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("schedules")
    .select("*")
    .order("visit_date", { ascending: false });
  if (cohort === "weekday" || cohort === "weekend") {
    query = query.eq("cohort", cohort);
  }
  const { data } = await query;
  const schedules = (data ?? []) as Schedule[];

  return (
    <div>
      <PageHeader
        title="임장 일정"
        description="반·조별 임장 일정과 계획을 확인하세요."
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
                      <span>{formatDate(s.visit_date)}</span>
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
