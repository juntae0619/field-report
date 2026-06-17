"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { type Memo } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/submit-button";
import { updateMemo, deleteMemo } from "./actions";

export function MemoCard({ memo }: { memo: Memo }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{memo.title}</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
              >
                <Pencil className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>메모 수정</DialogTitle>
              </DialogHeader>
              <form
                action={async (formData) => {
                  await updateMemo(formData);
                  setOpen(false);
                }}
                className="flex flex-col gap-4"
              >
                <input type="hidden" name="id" value={memo.id} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`title-${memo.id}`}>제목</Label>
                  <Input
                    id={`title-${memo.id}`}
                    name="title"
                    defaultValue={memo.title}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`content-${memo.id}`}>내용</Label>
                  <Textarea
                    id={`content-${memo.id}`}
                    name="content"
                    rows={6}
                    defaultValue={memo.content ?? ""}
                  />
                </div>
                <DialogFooter>
                  <SubmitButton>저장</SubmitButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {memo.content && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {memo.content}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(memo.updated_at, true)}
          </span>
          <form action={deleteMemo}>
            <input type="hidden" name="id" value={memo.id} />
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              삭제
            </button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
