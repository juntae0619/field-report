import Link from "next/link";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card>
      <h2 className="mb-6 font-heading text-page-title">회원가입</h2>
      <form action={signup} className="flex flex-col gap-4">
        <div className="form-field">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="홍길동"
            autoComplete="name"
            maxLength={100}
            required
          />
        </div>
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
            placeholder="12자 이상"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        {error && <p className="text-caption text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          가입하기
        </Button>
        <p className="text-center text-body-sm text-smoke-gray">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-sidebar-active underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
