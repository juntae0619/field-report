import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "../post-form";
import { createPost } from "../actions";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfile();
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title="글쓰기" />
      <Card>
        <CardContent>
          <PostForm action={createPost} error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
