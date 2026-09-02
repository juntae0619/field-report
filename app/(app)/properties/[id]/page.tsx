import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, ExternalLink, Home, MapPin, Pencil, Plus, Ruler } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatArea, formatDate, formatPriceManwon } from "@/lib/utils";
import {
  DEAL_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  type Feedback,
  type Property,
} from "@/lib/types";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
                <ConfirmSubmitButton variant="destructive" confirmMessage="이 물건과 연결된 피드백을 삭제하시겠습니까? 연결된 보고서는 유지됩니다.">
                  삭제
                </ConfirmSubmitButton>
              </form>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={property.status === "visited" ? "secondary" : "outline"}>
          {PROPERTY_STATUS_LABEL[property.status]}
        </Badge>
        {property.deal_type && <Badge>{DEAL_TYPE_LABEL[property.deal_type]}</Badge>}
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>물건 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <Banknote className="mt-0.5 size-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">매매가·보증금·최저가</p><p className="text-sm font-medium">{formatPriceManwon(property.asking_price_manwon)}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <Ruler className="mt-0.5 size-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">전용면적</p><p className="text-sm font-medium">{formatArea(property.exclusive_area_m2)}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <Home className="mt-0.5 size-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">준공·세대수</p><p className="text-sm font-medium">{property.building_year ? `${property.building_year}년` : "-"} · {property.households !== null ? `${property.households.toLocaleString("ko-KR")}세대` : "-"}</p></div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">월세·관리비</p>
            <p className="text-sm font-medium">
              월세 {formatPriceManwon(property.monthly_rent_manwon)} · 관리비 {formatPriceManwon(property.maintenance_fee_manwon)}
            </p>
          </div>
          {property.source_url && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button variant="outline" size="sm" asChild>
                <a href={property.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" /> 원문 매물·경공매 페이지 열기
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {property.note && (
        <Card className="mb-6">
          <CardHeader><CardTitle>사전 조사·현장 체크 메모</CardTitle></CardHeader>
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
