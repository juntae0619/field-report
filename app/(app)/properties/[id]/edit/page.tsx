import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Property } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyForm } from "../../property-form";
import { updateProperty } from "../../actions";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const property = data as Property;

  if (profile.role !== "admin" && property.created_by !== profile.id) {
    redirect(`/properties/${id}`);
  }

  const action = updateProperty.bind(null, id);

  return (
    <div>
      <PageHeader title="임장 희망 물건 수정" />
      <Card>
        <CardContent>
          <PropertyForm action={action} property={property} />
        </CardContent>
      </Card>
    </div>
  );
}
