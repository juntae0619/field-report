"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Schedule } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function ScheduleCalendar({
  initialSchedules,
}: {
  initialSchedules: Schedule[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    supabase
      .from("schedules")
      .select("*")
      .gte("visit_date", start)
      .lte("visit_date", end)
      .order("visit_date")
      .then(({ data }) => {
        if (data) setSchedules(data as Schedule[]);
        setLoading(false);
      });
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getEventsForDay(day: Date) {
    return schedules.filter((s) => isSameDay(parseISO(s.visit_date), day));
  }

  const selectedEvents = getEventsForDay(selectedDay);

  return (
    <div className={cn("flex flex-col gap-3", loading && "opacity-60 transition-opacity")}>
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="rounded p-1 hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold">
          {format(currentMonth, "yyyy")}년 {format(currentMonth, "M")}월
        </span>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="rounded p-1 hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* 범례 */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full bg-blue-500" />
          임장 일정
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full bg-orange-500" />
          발표 일정
        </span>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
        {days.map((day) => {
          const events = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDay);

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 bg-background p-1",
                "min-h-10 md:min-h-[4.5rem]",
                !inMonth && "opacity-30",
                isSelected && "ring-2 ring-inset ring-blue-400 md:ring-0"
              )}
            >
              <span
                className={cn(
                  "mb-0.5 self-end rounded-full px-1.5 text-xs leading-5",
                  isToday && "bg-blue-600 font-bold text-white"
                )}
              >
                {format(day, "d")}
              </span>

              {/* 모바일: 색 점(dot)만 표시 */}
              <div className="flex flex-wrap gap-0.5 md:hidden">
                {events.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      s.type === "visit" ? "bg-blue-500" : "bg-orange-500"
                    )}
                  />
                ))}
                {events.length > 3 && (
                  <span className="size-1.5 rounded-full bg-gray-400" />
                )}
              </div>

              {/* 데스크톱: 텍스트 pill */}
              {events.slice(0, 2).map((s) => (
                <Link
                  key={s.id}
                  href={`/schedules/${s.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "hidden truncate rounded px-1 py-px text-xs leading-4 text-white md:block",
                    s.type === "visit"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  )}
                  title={s.title}
                >
                  {s.title}
                </Link>
              ))}
              {events.length > 2 && (
                <span className="hidden text-xs text-muted-foreground md:block">
                  +{events.length - 2}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 모바일: 선택한 날짜의 일정 리스트 */}
      <div className="md:hidden">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {format(selectedDay, "M월 d일")} 일정
        </p>
        {selectedEvents.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            일정이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedEvents.map((s) => (
              <Link
                key={s.id}
                href={`/schedules/${s.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    s.type === "visit" ? "bg-blue-500" : "bg-orange-500"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.type === "visit" ? "임장 일정" : "발표 일정"}
                    {s.region ? ` · ${s.region}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
