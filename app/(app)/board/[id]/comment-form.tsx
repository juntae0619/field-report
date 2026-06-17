"use client";

import { useRef } from "react";
import { addComment } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addComment(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="post_id" value={postId} />
      <Textarea
        name="content"
        rows={2}
        required
        placeholder="댓글을 입력하세요."
      />
      <div className="flex justify-end">
        <SubmitButton size="sm">댓글 등록</SubmitButton>
      </div>
    </form>
  );
}
