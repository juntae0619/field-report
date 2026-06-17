import Link from "next/link";
import { Plus, CalendarDays, MapPin, Paperclip } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarsDisplay } from "@/components/stars";
import { ReportsFilter } from "./reports-filter";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    year?: string;
    month?: string;
    region?: string;
  }>;
}) {
  await requireProfile();
  const supabase = await createClient();

  const { q, year, month, region } = await searchParams;
  const hasFilter = Boolean(q || year || month || region);

  // 검색용 드롭다운: 보고서에 존재하는 년도 목록
  const { data: allDates } = await supabase
    .from("reports")
    .select("visit_date");
  const years = Array.from(
    new Set(
      (allDates ?? [])
        .map((d) => d.visit_date?.slice(0, 4))
        .filter((y): y is string => Boolean(y))
    )
  ).sort((a, b) => b.localeCompare(a));

  let query = supabase
    .from("reports")
    .select(
      "id, title, visit_date, region, rating, created_at, author:profiles(name), property:properties(name), report_files(count)"
    )
    .order("visit_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (q) {
    const term = q.replace(/[%,]/g, " ").trim();
    query = query.or(
      `title.ilike.%${term}%,region.ilike.%${term}%,conclusion.ilike.%${term}%`
    );
  }
  if (region) {
    query = query.ilike("region", `%${region}%`);
  }
  if (year) {
    const y = Number(year);
    if (month) {
      const m = Number(month);
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const endY = m === 12 ? y + 1 : y;
      const endM = m === 12 ? 1 : m + 1;
      const end = `${endY}-${String(endM).padStart(2, "0")}-01`;
      query = query.gte("visit_date", start).lt("visit_date", end);
    } else {
      query = query.gte("visit_date", `${y}-01-01`).lt("visit_date", `${y + 1}-01-01`);
    }
  }

  let { data: reports } = await query;

  // 년도 없이 월만 선택한 경우는 가져온 결과에서 월로 추가 필터
  if (month && !year) {
    const mm = String(Number(month)).padStart(2, "0");
    reports = (reports ?? []).filter((r) => r.visit_date?.slice(5, 7) === mm);
  }

  return (
    <div>
      <PageHeader
        title="임장보고서"
        description="조원들이 작성한 임장보고서를 확인하세요."
        action={
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="size-4" /> 임장보고서 작성
            </Link>
          </Button>
        }
      />

      <ReportsFilter years={years} />

      {(reports?.length ?? 0) === 0 ? (
        hasFilter ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description="다른 키워드나 조건으로 검색해보세요."
          />
        ) : (
          <EmptyState
            title="작성된 임장보고서가 없습니다"
            description="첫 임장보고서를 작성해보세요."
            action={
              <Button asChild className="mt-2">
                <Link href="/reports/new">임장보고서 작성</Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reports?.map((r) => {
            const author = r.author as unknown as { name: string } | null;
            const property = r.property as unknown as { name: string } | null;
            const fileCount =
              (r.report_files as unknown as { count: number }[] | null)?.[0]
                ?.count ?? 0;
            return (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <Card className="h-full gap-3 py-4 hover-row">
                  <CardContent className="flex h-full flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {r.title}
                        {fileCount > 0 && (
                          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </span>
                      <StarsDisplay value={r.rating} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.visit_date && (
                        <Badge variant="outline" className="gap-1">
                          <CalendarDays className="size-3.5" />
                          {formatDate(r.visit_date)}
                        </Badge>
                      )}
                      {r.region && (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="size-3.5" />
                          {r.region}
                        </Badge>
                      )}
                      {property && (
                        <Badge variant="outline">{property.name}</Badge>
                      )}
                      {fileCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Paperclip className="size-3.5" />
                          첨부 {fileCount}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-auto text-xs text-muted-foreground">
                      {author?.name} · {formatDate(r.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
