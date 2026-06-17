import Link from "next/link";
import { Plus, MapPin } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Property } from "@/lib/types";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function PropertiesPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  const properties = (data ?? []) as Property[];

  return (
    <div>
      <PageHeader
        title="임장 희망 물건"
        description="임장 희망 물건을 등록하고 피드백을 모으세요."
        action={
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="size-4" /> 희망 물건 등록
            </Link>
          </Button>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          title="등록된 희망 물건이 없습니다"
          description="임장 희망 물건을 등록해보세요."
          action={
            <Button asChild className="mt-2">
              <Link href="/properties/new">희망 물건 등록</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="h-full gap-2 py-4 hover-row">
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {p.property_type && (
                      <Badge variant="outline">{p.property_type}</Badge>
                    )}
                  </div>
                  {(p.region || p.address) && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {p.region ?? p.address}
                    </p>
                  )}
                  {p.note && (
                    <p className="mt-auto line-clamp-2 text-xs text-muted-foreground">
                      {p.note}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
