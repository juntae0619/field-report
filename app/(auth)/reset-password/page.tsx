import { updatePassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card>
      <h2 className="mb-2 font-heading text-page-title">새 비밀번호 설정</h2>
      <p className="mb-6 text-body-sm text-smoke-gray">
        앞으로 사용할 새 비밀번호를 입력해주세요.
      </p>
      <form action={updatePassword} className="flex flex-col gap-4">
        <div className="form-field">
          <Label htmlFor="password">새 비밀번호</Label>
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
        <div className="form-field">
          <Label htmlFor="password_confirm">새 비밀번호 확인</Label>
          <Input
            id="password_confirm"
            name="password_confirm"
            type="password"
            placeholder="한 번 더 입력"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        {error && <p className="text-caption text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          비밀번호 변경
        </Button>
      </form>
    </Card>
  );
}
