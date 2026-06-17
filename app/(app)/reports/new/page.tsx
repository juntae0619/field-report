import { requireProfile } from "@/lib/auth";
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
