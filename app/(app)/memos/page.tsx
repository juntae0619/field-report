import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Memo } from "@/lib/types";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { MemoCard } from "./memo-card";
import { createMemo } from "./actions";

export default async function MemosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("memos")
    .select("*")
    .eq("owner_id", profile.id)
    .order("updated_at", { ascending: false });
  const memos = (data ?? []) as Memo[];

  return (
    <div>
      <PageHeader
        title="내 메모"
        description="나만 볼 수 있는 개인 메모입니다."
      />

      <Card className="mb-6">
        <CardContent>
          <form action={createMemo} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" placeholder="메모 제목" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                name="content"
                rows={3}
                placeholder="임장 중 떠오른 생각, 체크할 점 등"
              />
            </div>
            <div className="flex justify-end">
              <SubmitButton>메모 추가</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {memos.length === 0 ? (
        <EmptyState
          title="작성한 메모가 없습니다"
          description="위 양식으로 첫 메모를 추가해보세요."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {memos.map((m) => (
            <MemoCard key={m.id} memo={m} />
          ))}
        </div>
      )}
    </div>
  );
}
