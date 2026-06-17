import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Report } from "@/lib/types";
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

  return (
    <div>
      <PageHeader title="임장보고서 수정" />
      <Card>
        <CardContent>
          <ReportForm report={report as Report} />
        </CardContent>
      </Card>
    </div>
  );
}
