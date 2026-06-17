"use client";

import { assignMember } from "./actions";
import { type Profile } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

export function GroupAssign({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: Profile[];
}) {
  return (
    <form action={assignMember} className="flex items-center gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <Select name="profile_id">
        <SelectTrigger className="h-8 flex-1">
          <SelectValue placeholder="조원 추가..." />
        </SelectTrigger>
        <SelectContent>
          {candidates.length === 0 ? (
            <SelectItem value="none" disabled>
              추가할 조원이 없습니다
            </SelectItem>
          ) : (
            candidates.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name || p.email}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <SubmitButton size="sm">추가</SubmitButton>
    </form>
  );
}
