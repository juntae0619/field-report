import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Property, type Report, type Schedule } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReportForm } from "../../report-form";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (!report) notFound();
  if (profile.role !== "admin" && (report as Report).author_id !== profile.id) {
    redirect(`/reports/${id}`);
  }

  const [{ data: schedules }, { data: properties }] = await Promise.all([
    supabase.from("schedules").select("id, title, visit_date").order("visit_date", { ascending: false }).limit(200),
    supabase.from("properties").select("id, name, region").order("updated_at", { ascending: false }).limit(200),
  ]);

  return (
    <div>
      <PageHeader title="임장보고서 수정" />
      <Card>
        <CardContent>
          <ReportForm
            report={report as Report}
            schedules={(schedules ?? []) as Pick<Schedule, "id" | "title" | "visit_date">[]}
            properties={(properties ?? []) as Pick<Property, "id" | "name" | "region">[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
