"use client";

import Link from "next/link";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COHORT_FILTERS = [
  { value: "all", label: "전체" },
  { value: "weekday", label: "주중반" },
  { value: "weekend", label: "주말반" },
] as const;

export function ScheduleCohortTabs({ cohort }: { cohort: string }) {
  const value =
    cohort === "weekday" || cohort === "weekend" ? cohort : "all";

  return (
    <Tabs value={value} className="mb-4">
      <TabsList>
        {COHORT_FILTERS.map((f) => (
          <TabsTrigger key={f.value} value={f.value} asChild>
            <Link href={`/schedules?cohort=${f.value}`}>{f.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
