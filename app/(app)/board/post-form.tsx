import Link from "next/link";
import { type Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SubmitButton } from "@/components/submit-button";

export function PostForm({
  action,
  post,
  error,
}: {
  action: (formData: FormData) => void;
  post?: Post;
  error?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required defaultValue={post?.title} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">분류 (선택)</Label>
          <Input
            id="category"
            name="category"
            defaultValue={post?.category ?? ""}
            placeholder="공지 / 자료 / 잡담"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>내용</Label>
        <RichTextEditor name="content" defaultValue={post?.content ?? ""} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <SubmitButton>{post ? "수정 저장" : "등록"}</SubmitButton>
        <Button type="button" variant="outline" asChild>
          <Link href={post ? `/board/${post.id}` : "/board"}>취소</Link>
        </Button>
      </div>
    </form>
  );
}
