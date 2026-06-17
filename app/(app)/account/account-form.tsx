"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { COHORT_LABEL, ROLE_LABEL, type Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccountForm({ profile }: { profile: Profile }) {
  const supabase = createClient();

  const [name, setName] = useState(profile.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() || "(이름 없음)" })
      .eq("id", profile.id);
    setSavingName(false);
    if (error) toast.error(error.message);
    else toast.success("이름을 변경했습니다.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw1.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (pw1 !== pw2) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setSavingPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("비밀번호를 변경했습니다.");
      setPw1("");
      setPw2("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary">{ROLE_LABEL[profile.role]}</Badge>
            {profile.cohort && (
              <Badge variant="outline">{COHORT_LABEL[profile.cohort]}</Badge>
            )}
          </div>
          <form onSubmit={saveName} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
              />
            </div>
            <div>
              <Button type="submit" disabled={savingName}>
                {savingName && <Loader2 className="size-4 animate-spin" />}
                이름 저장
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>새 비밀번호를 입력하세요. (6자 이상)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pw1">새 비밀번호</Label>
              <Input
                id="pw1"
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pw2">새 비밀번호 확인</Label>
              <Input
                id="pw2"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Button type="submit" disabled={savingPw}>
                {savingPw && <Loader2 className="size-4 animate-spin" />}
                비밀번호 변경
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
