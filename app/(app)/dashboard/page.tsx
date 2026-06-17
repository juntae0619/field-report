import Link from "next/link";
import { CalendarDays, FileText, MessageSquare, Building2 } from "lucide-react";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: upcoming },
    { data: recentReports },
    { data: recentPosts },
    { count: propertyCount },
  ] = await Promise.all([
    supabase
      .from("schedules")
      .select("*")
      .gte("visit_date", today)
      .order("visit_date")
      .limit(5),
    supabase
      .from("reports")
      .select("id, title, created_at, author:profiles(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id, title, created_at, author:profiles(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("properties").select("*", { count: "exact", head: true }),
  ]);

  const upcomingList = (upcoming ?? []) as Schedule[];

  return (
    <div>
      <PageHeader
        title={`${profile.name}님, 안녕하세요`}
        description="다가오는 임장 일정과 최근 소식을 확인하세요."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="다가오는 일정"
          value={upcomingList.length}
          href="/schedules"
        />
        <StatCard
          icon={<FileText className="size-5" />}
          label="최근 임장보고서"
          value={recentReports?.length ?? 0}
          href="/reports"
        />
        <StatCard
          icon={<Building2 className="size-5" />}
          label="희망 물건"
          value={propertyCount ?? 0}
          href="/properties"
        />
        <StatCard
          icon={<MessageSquare className="size-5" />}
          label="게시글"
          value={recentPosts?.length ?? 0}
          href="/board"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>다가오는 임장 일정</CardTitle>
            <Link
              href="/schedules"
              className="text-sm text-smoke-gray transition-colors hover:text-sidebar-active hover:underline"
            >
              전체 보기
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {upcomingList.length === 0 && (
              <EmptyStateCompact title="예정된 일정이 없습니다." />
            )}
            {upcomingList.map((s) => (
              <Link
                key={s.id}
                href={`/schedules/${s.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover-row"
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-smoke-gray">
                    {formatDate(s.visit_date)} · {s.region ?? "지역 미정"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline">
                    {COHORT_LABEL[s.cohort as Cohort]}
                  </Badge>
                  <Badge
                    variant={s.status === "done" ? "secondary" : "default"}
                  >
                    {SCHEDULE_STATUS_LABEL[s.status as ScheduleStatus]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>최근 임장보고서</CardTitle>
            <Link
              href="/reports"
              className="text-sm text-smoke-gray transition-colors hover:text-sidebar-active hover:underline"
            >
              전체 보기
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(recentReports?.length ?? 0) === 0 && (
              <EmptyStateCompact title="작성된 임장보고서가 없습니다." />
            )}
            {recentReports?.map((r) => {
              const author = r.author as unknown as { name: string } | null;
              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover-row"
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-smoke-gray">
                    {author?.name} · {formatDate(r.created_at)}
                  </p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="gap-2 transition-colors hover:shadow-hover">
        <CardContent className="flex items-center gap-3">
          <div className="icon-accent size-10">{icon}</div>
          <div>
            <p className="text-kpi">{value}</p>
            <p className="text-caption text-smoke-gray">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
