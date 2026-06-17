"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function ReportsFilter({ years }: { years: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [year, setYear] = useState(sp.get("year") ?? "all");
  const [month, setMonth] = useState(sp.get("month") ?? "all");
  const [region, setRegion] = useState(sp.get("region") ?? "");

  const hasFilter =
    Boolean(sp.get("q")) ||
    Boolean(sp.get("year")) ||
    Boolean(sp.get("month")) ||
    Boolean(sp.get("region"));

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (year !== "all") params.set("year", year);
    if (month !== "all") params.set("month", month);
    if (region.trim()) params.set("region", region.trim());
    const qs = params.toString();
    router.push(qs ? `/reports?${qs}` : "/reports");
  }

  function reset() {
    setQ("");
    setYear("all");
    setMonth("all");
    setRegion("");
    router.push("/reports");
  }

  return (
    <form
      onSubmit={apply}
      className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5 sm:min-w-48">
        <label className="text-xs font-medium text-muted-foreground">
          키워드
        </label>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목 · 지역 · 총평 검색"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:w-32">
        <label className="text-xs font-medium text-muted-foreground">년도</label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-28">
        <label className="text-xs font-medium text-muted-foreground">월</label>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-40">
        <label className="text-xs font-medium text-muted-foreground">지역</label>
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="예) 송파구"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          <Search className="size-4" /> 검색
        </Button>
        {hasFilter && (
          <Button type="button" variant="outline" onClick={reset}>
            <X className="size-4" /> 초기화
          </Button>
        )}
      </div>
    </form>
  );
}
