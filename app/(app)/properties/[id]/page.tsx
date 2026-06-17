import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Pencil, Plus } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { type Feedback, type Property } from "@/lib/types";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarsDisplay } from "@/components/stars";
import { PropertyFeedbackForm } from "./property-feedback-form";
import { deleteProperty, deletePropertyFeedback } from "../actions";

export default async function PropertyDetailPage({
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

  const [{ data: reports }, { data: feedbacks }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, title, rating, created_at, author:profiles(name)")
      .eq("property_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("feedbacks")
      .select("*, author:profiles(id, name)")
      .eq("property_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const canEdit =
    profile.role === "admin" || property.created_by === profile.id;

  return (
    <div>
      <PageHeader
        title={property.name}
        action={
          canEdit ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/properties/${id}/edit`}>
                  <Pencil className="size-4" /> 수정
                </Link>
              </Button>
              <form action={deleteProperty}>
                <input type="hidden" name="id" value={id} />
                <Button variant="destructive" type="submit">
                  삭제
                </Button>
              </form>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {property.property_type && (
          <Badge variant="outline">{property.property_type}</Badge>
        )}
        {property.auction_no && (
          <Badge variant="secondary">경공매 {property.auction_no}</Badge>
        )}
        {(property.region || property.address) && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {[property.region, property.address].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      {property.note && (
        <Card className="mb-6">
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {property.note}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>관련 임장보고서</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/reports/new?property=${id}`}>
              <Plus className="size-4" /> 임장보고서 작성
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(reports?.length ?? 0) === 0 && (
            <EmptyStateCompact title="아직 임장보고서가 없습니다." />
          )}
          {reports?.map((r) => {
            const author = r.author as unknown as { name: string } | null;
            return (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover-row"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  <StarsDisplay value={r.rating} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {author?.name} · {formatDate(r.created_at)}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            물건 피드백{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({feedbacks?.length ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PropertyFeedbackForm propertyId={id} />
          <Separator />
          <div className="flex flex-col gap-3">
            {(feedbacks?.length ?? 0) === 0 && (
              <EmptyStateCompact title="아직 피드백이 없습니다." />
            )}
            {(feedbacks as (Feedback & { author: { id: string; name: string } | null })[] | null)?.map(
              (f) => {
                const canDelete =
                  profile.role === "admin" || f.author_id === profile.id;
                return (
                  <div key={f.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {f.author?.name}
                        </span>
                        <StarsDisplay value={f.rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(f.created_at, true)}
                        </span>
                        {canDelete && (
                          <form action={deletePropertyFeedback}>
                            <input
                              type="hidden"
                              name="feedback_id"
                              value={f.id}
                            />
                            <input
                              type="hidden"
                              name="property_id"
                              value={id}
                            />
                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              삭제
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{f.content}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
