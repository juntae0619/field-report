import { X } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { COHORT_LABEL, type Cohort, type Profile } from "@/lib/types";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { MemberRow } from "./member-row";
import { GroupAssign } from "./group-assign";
import { createGroup, deleteGroup, removeMember } from "./actions";

export default async function MembersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: groups }, { data: memberships }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("groups").select("*").order("created_at"),
      supabase
        .from("group_members")
        .select("group_id, profile_id, profiles(*)"),
    ]);

  const allProfiles = (profiles ?? []) as Profile[];
  const allGroups = groups ?? [];

  const membersByGroup = new Map<string, Profile[]>();
  for (const m of memberships ?? []) {
    const arr = membersByGroup.get(m.group_id) ?? [];
    if (m.profiles) arr.push(m.profiles as unknown as Profile);
    membersByGroup.set(m.group_id, arr);
  }

  return (
    <div>
      <PageHeader
        title="조원 관리"
        description="조원 권한·반 설정과 조 편성을 관리합니다."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 조 편성 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>조 편성</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <form
              action={createGroup}
              className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="group-name">조 이름</Label>
                <Input
                  id="group-name"
                  name="name"
                  placeholder="예) 주중 3조"
                  required
                  className="w-44"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>반</Label>
                <Select name="cohort" defaultValue="weekday">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">주중반</SelectItem>
                    <SelectItem value="weekend">주말반</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SubmitButton>조 추가</SubmitButton>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
              {allGroups.length === 0 && (
                <EmptyStateCompact
                  title="아직 생성된 조가 없습니다"
                  description="위 양식에서 조 이름과 반을 선택해 추가하세요."
                />
              )}
              {allGroups.map((g) => {
                const members = membersByGroup.get(g.id) ?? [];
                const memberIds = new Set(members.map((m) => m.id));
                const candidates = allProfiles.filter(
                  (p) => !memberIds.has(p.id)
                );
                return (
                  <div key={g.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{g.name}</span>
                        <Badge variant="outline">
                          {COHORT_LABEL[g.cohort as Cohort]}
                        </Badge>
                      </div>
                      <form action={deleteGroup}>
                        <input type="hidden" name="group_id" value={g.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          삭제
                        </Button>
                      </form>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {members.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          소속 조원 없음
                        </span>
                      )}
                      {members.map((m) => (
                        <Badge
                          key={m.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {m.name || m.email}
                          <form action={removeMember} className="inline-flex">
                            <input
                              type="hidden"
                              name="group_id"
                              value={g.id}
                            />
                            <input
                              type="hidden"
                              name="profile_id"
                              value={m.id}
                            />
                            <button
                              type="submit"
                              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                            >
                              <X className="size-3" />
                            </button>
                          </form>
                        </Badge>
                      ))}
                    </div>
                    <GroupAssign groupId={g.id} candidates={candidates} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 조원 권한/반 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              조원 목록{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({allProfiles.length}명)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allProfiles.map((p) => (
              <MemberRow key={p.id} profile={p} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
