import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Property, type Schedule } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReportForm } from "../report-form";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ schedule?: string; property?: string }>;
}) {
  await requireProfile();
  const { schedule, property } = await searchParams;
  const supabase = await createClient();
  const [{ data: schedules }, { data: properties }] = await Promise.all([
    supabase.from("schedules").select("id, title, visit_date").order("visit_date", { ascending: false }).limit(200),
    supabase.from("properties").select("id, name, region").neq("status", "archived").order("updated_at", { ascending: false }).limit(200),
  ]);

  return (
    <div>
      <PageHeader
        title="임장보고서 작성"
        description="임장일자·지역을 입력하고 보고서 파일을 첨부하세요."
      />
      <Card>
        <CardContent>
          <ReportForm
            defaultScheduleId={schedule}
            defaultPropertyId={property}
            schedules={(schedules ?? []) as Pick<Schedule, "id" | "title" | "visit_date">[]}
            properties={(properties ?? []) as Pick<Property, "id" | "name" | "region">[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
