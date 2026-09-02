import Link from "next/link";
import { Plus, MapPin, Search } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DEAL_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  type DealType,
  type Property,
  type PropertyStatus,
} from "@/lib/types";
import { formatArea, formatPriceManwon } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PROPERTY_STATUSES = Object.entries(PROPERTY_STATUS_LABEL) as [PropertyStatus, string][];
const DEAL_TYPES = Object.entries(DEAL_TYPE_LABEL) as [DealType, string][];

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; deal?: string }>;
}) {
  await requireProfile();
  const supabase = await createClient();
  const { q = "", status = "all", deal = "all" } = await searchParams;
  const hasFilter = Boolean(q || status !== "all" || deal !== "all");

  let query = supabase
    .from("properties")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  const term = q.replace(/[%,()]/g, " ").trim();
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,address.ilike.%${term}%,region.ilike.%${term}%,auction_no.ilike.%${term}%`
    );
  }
  if (PROPERTY_STATUSES.some(([value]) => value === status)) {
    query = query.eq("status", status);
  }
  if (DEAL_TYPES.some(([value]) => value === deal)) {
    query = query.eq("deal_type", deal);
  }

  const { data } = await query;
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

      <form className="mb-5 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_150px_150px_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="단지명, 주소, 지역, 사건번호" className="pl-9" />
        </div>
        <select name="status" defaultValue={status} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="all">전체 상태</option>
          {PROPERTY_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="deal" defaultValue={deal} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="all">전체 거래</option>
          {DEAL_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Button type="submit" variant="outline">검색</Button>
        {hasFilter && <Button variant="ghost" asChild><Link href="/properties">초기화</Link></Button>}
      </form>

      {properties.length === 0 ? (
        <EmptyState
          title={hasFilter ? "조건에 맞는 물건이 없습니다" : "등록된 희망 물건이 없습니다"}
          description={hasFilter ? "검색어나 필터를 바꿔보세요." : "임장 희망 물건을 등록해보세요."}
          action={!hasFilter ? (
            <Button asChild className="mt-2">
              <Link href="/properties/new">희망 물건 등록</Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="h-full gap-2 py-4 hover-row">
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Badge variant={p.status === "visited" ? "secondary" : "outline"}>
                        {PROPERTY_STATUS_LABEL[p.status]}
                      </Badge>
                      {p.property_type && <Badge variant="outline">{p.property_type}</Badge>}
                    </div>
                  </div>
                  {(p.region || p.address) && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {p.region ?? p.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {p.deal_type && <span>{DEAL_TYPE_LABEL[p.deal_type]}</span>}
                    {p.asking_price_manwon !== null && <span>{formatPriceManwon(p.asking_price_manwon)}</span>}
                    {p.exclusive_area_m2 !== null && <span>{formatArea(p.exclusive_area_m2)}</span>}
                  </div>
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
