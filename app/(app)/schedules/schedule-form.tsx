"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Group, type Schedule, type ScheduleType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

export function ScheduleForm({
  action,
  groups,
  schedule,
  error,
}: {
  action: (formData: FormData) => void;
  groups: Group[];
  schedule?: Schedule;
  error?: string;
}) {
  const [type, setType] = useState<ScheduleType>(schedule?.type ?? "visit");

  const isVisit = type === "visit";

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* 일정 유형 토글 */}
      <input type="hidden" name="type" value={type} />
      <div className="flex gap-2 rounded-xl border p-1.5">
        <button
          type="button"
          onClick={() => setType("visit")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors",
            isVisit
              ? "bg-blue-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          임장 일정
        </button>
        <button
          type="button"
          onClick={() => setType("presentation")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors",
            !isVisit
              ? "bg-orange-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          발표 일정
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={schedule?.title}
          placeholder={isVisit ? "예) 송파구 임장" : "예) 3조 임장 발표"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="visit_date">{isVisit ? "임장 날짜" : "발표 날짜"}</Label>
          <Input
            id="visit_date"
            name="visit_date"
            type="date"
            required
            defaultValue={schedule?.visit_date}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="region">{isVisit ? "지역" : "장소"}</Label>
          <Input
            id="region"
            name="region"
            defaultValue={schedule?.region ?? ""}
            placeholder={isVisit ? "예) 서울 송파구" : "예) 강남 스터디룸"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>반</Label>
          <Select name="cohort" defaultValue={schedule?.cohort ?? "weekday"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekday">주중반</SelectItem>
              <SelectItem value="weekend">주말반</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>조</Label>
          <Select name="group_id" defaultValue={schedule?.group_id ?? "none"}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">전체 / 미지정</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>상태</Label>
        <Select name="status" defaultValue={schedule?.status ?? "planned"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">예정</SelectItem>
            <SelectItem value="done">완료</SelectItem>
            <SelectItem value="canceled">취소</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="plan">{isVisit ? "임장 계획" : "발표 내용"}</Label>
        <Textarea
          id="plan"
          name="plan"
          rows={8}
          defaultValue={schedule?.plan ?? ""}
          placeholder={
            isVisit
              ? "동선, 방문 단지, 체크리스트, 집결 시간/장소 등을 적어주세요."
              : "발표 순서, 자료 준비 사항, 참석 안내 등을 적어주세요."
          }
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <SubmitButton>{schedule ? "수정 저장" : "일정 등록"}</SubmitButton>
        <Button type="button" variant="outline" asChild>
          <Link href={schedule ? `/schedules/${schedule.id}` : "/schedules"}>
            취소
          </Link>
        </Button>
      </div>
    </form>
  );
}
