import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <Card>
      <h2 className="mb-2 font-heading text-page-title">비밀번호 찾기</h2>
      <p className="mb-6 text-body-sm text-smoke-gray">
        가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
      </p>
      <form action={requestPasswordReset} className="flex flex-col gap-4">
        <div className="form-field">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            required
          />
        </div>
        {message && (
          <p className="text-caption text-sidebar-active">{message}</p>
        )}
        {error && <p className="text-caption text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          재설정 메일 보내기
        </Button>
        <p className="text-center text-body-sm text-smoke-gray">
          <Link
            href="/login"
            className="font-medium text-sidebar-active underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </form>
    </Card>
  );
}
