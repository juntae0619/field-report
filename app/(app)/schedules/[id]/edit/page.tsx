import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Group, type Schedule } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleForm } from "../../schedule-form";
import { updateSchedule } from "../../actions";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: schedule }, { data: groups }] = await Promise.all([
    supabase.from("schedules").select("*").eq("id", id).single(),
    supabase.from("groups").select("*").order("created_at"),
  ]);

  if (!schedule) notFound();

  const action = updateSchedule.bind(null, id);

  return (
    <div>
      <PageHeader title="일정 수정" />
      <Card>
        <CardContent>
          <ScheduleForm
            action={action}
            groups={(groups ?? []) as Group[]}
            schedule={schedule as Schedule}
          />
        </CardContent>
      </Card>
    </div>
  );
}
