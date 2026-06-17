import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { AccountForm } from "./account-form";

export default async function AccountPage() {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader
        title="내 계정"
        description="이름과 비밀번호를 변경할 수 있습니다."
      />
      <AccountForm profile={profile} />
    </div>
  );
}
