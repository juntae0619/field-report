import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyForm } from "../property-form";
import { createProperty } from "../actions";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfile();
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title="임장 희망 물건 등록" />
      <Card>
        <CardContent>
          <PropertyForm action={createProperty} error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
