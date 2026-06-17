"use client";

import { updateMember } from "./actions";
import { type Profile } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { ResetPasswordButton } from "./reset-password-button";

export function MemberRow({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="min-w-0 flex-1 sm:min-w-40">
        <p className="font-medium">{profile.name || "(이름 없음)"}</p>
        <p className="text-xs text-smoke-gray">{profile.email}</p>
      </div>

      <form
        action={updateMember}
        className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
      >
        <input type="hidden" name="profile_id" value={profile.id} />
        <div className="w-full sm:w-28">
          <Select name="role" defaultValue={profile.role}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">조원</SelectItem>
              <SelectItem value="admin">운영자</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-28">
          <Select name="cohort" defaultValue={profile.cohort ?? "none"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미지정</SelectItem>
              <SelectItem value="weekday">주중반</SelectItem>
              <SelectItem value="weekend">주말반</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SubmitButton size="sm" variant="outline" className="w-full sm:w-auto">
          저장
        </SubmitButton>
      </form>

      <ResetPasswordButton
        profileId={profile.id}
        name={profile.name || profile.email || "조원"}
      />
    </div>
  );
}
