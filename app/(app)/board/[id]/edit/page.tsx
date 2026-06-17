import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Post } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "../../post-form";
import { updatePost } from "../../actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.from("posts").select("*").eq("id", id).single();
  if (!data) notFound();
  const post = data as Post;

  if (profile.role !== "admin" && post.author_id !== profile.id) {
    redirect(`/board/${id}`);
  }

  const action = updatePost.bind(null, id);

  return (
    <div>
      <PageHeader title="글 수정" />
      <Card>
        <CardContent>
          <PostForm action={action} post={post} />
        </CardContent>
      </Card>
    </div>
  );
}
