"use client";

import { useRef } from "react";
import { addFeedback } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarsInput } from "@/components/stars";
import { SubmitButton } from "@/components/submit-button";

export function FeedbackForm({ reportId }: { reportId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addFeedback(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
    >
      <input type="hidden" name="report_id" value={reportId} />
      <div className="flex flex-col gap-2">
        <Label>평점 (선택)</Label>
        <StarsInput name="rating" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">피드백</Label>
        <Textarea
          id="content"
          name="content"
          rows={3}
          required
          placeholder="이 임장보고서에 대한 의견을 남겨주세요."
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm">피드백 등록</SubmitButton>
      </div>
    </form>
  );
}
