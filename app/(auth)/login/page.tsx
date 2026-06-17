import Link from "next/link";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card>
      <h2 className="mb-6 font-heading text-page-title">로그인</h2>
      <form action={login} className="flex flex-col gap-4">
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
        <div className="form-field">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-caption text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          로그인
        </Button>
        <p className="text-center text-body-sm text-smoke-gray">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-sidebar-active underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
