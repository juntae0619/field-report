"use client";

import { useRef } from "react";
import { addPropertyFeedback } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarsInput } from "@/components/stars";
import { SubmitButton } from "@/components/submit-button";

export function PropertyFeedbackForm({ propertyId }: { propertyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addPropertyFeedback(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
    >
      <input type="hidden" name="property_id" value={propertyId} />
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
          placeholder="이 물건에 대한 의견을 남겨주세요."
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm">피드백 등록</SubmitButton>
      </div>
    </form>
  );
}
