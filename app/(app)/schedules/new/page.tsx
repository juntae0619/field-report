import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Group } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleForm } from "../schedule-form";
import { createSchedule } from "../actions";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at");

  return (
    <div>
      <PageHeader title="새 임장 일정" description="임장 일정과 계획을 등록합니다." />
      <Card>
        <CardContent>
          <ScheduleForm
            action={createSchedule}
            groups={(groups ?? []) as Group[]}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
