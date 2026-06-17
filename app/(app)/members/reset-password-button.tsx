"use client";

import { useState } from "react";
import { KeyRound, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { resetMemberPassword } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ResetPasswordButton({
  profileId,
  name,
}: {
  profileId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setLoading(true);
    const res = await resetMemberPassword(profileId);
    setLoading(false);
    if (res.ok && res.password) {
      setTempPw(res.password);
    } else {
      toast.error(res.error ?? "초기화에 실패했습니다.");
      setOpen(false);
    }
  }

  function copy() {
    if (!tempPw) return;
    navigator.clipboard.writeText(tempPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          setTempPw(null);
          setOpen(true);
        }}
      >
        <KeyRound className="size-3.5" /> 비번 초기화
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>
              {name} 님의 비밀번호를 임시 비밀번호로 초기화합니다.
            </DialogDescription>
          </DialogHeader>

          {tempPw ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                아래 임시 비밀번호를 조원에게 전달하세요. 로그인 후 &lsquo;내
                계정&rsquo;에서 변경하도록 안내해 주세요.
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
                <code className="flex-1 text-sm font-semibold">{tempPw}</code>
                <Button type="button" size="sm" variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  복사
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              계속하면 새 임시 비밀번호가 생성됩니다.
            </p>
          )}

          <DialogFooter>
            {tempPw ? (
              <Button onClick={() => setOpen(false)}>확인</Button>
            ) : (
              <Button onClick={handleReset} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                초기화 실행
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
