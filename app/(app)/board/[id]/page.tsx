import Link from "next/link";
import { notFound } from "next/navigation";
import { Pin, Pencil } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml, isHtmlEmpty } from "@/lib/sanitize";
import { type Comment, type Post } from "@/lib/types";
import { PageHeader, EmptyStateCompact } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { CommentForm } from "./comment-form";
import { deletePost, deleteComment, togglePin } from "../actions";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles(id, name)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const post = data as Post & { author: { id: string; name: string } | null };

  const { data: comments } = await supabase
    .from("comments")
    .select("*, author:profiles(id, name)")
    .eq("post_id", id)
    .order("created_at");

  const canEdit = profile.role === "admin" || post.author_id === profile.id;
  const isAdmin = profile.role === "admin";

  return (
    <div>
      <PageHeader
        title={post.title}
        action={
          <div className="flex gap-2">
            {isAdmin && (
              <form action={togglePin}>
                <input type="hidden" name="id" value={id} />
                <input
                  type="hidden"
                  name="pinned"
                  value={String(post.pinned)}
                />
                <Button variant="outline" type="submit">
                  <Pin className="size-4" />
                  {post.pinned ? "고정 해제" : "상단 고정"}
                </Button>
              </form>
            )}
            {canEdit && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/board/${id}/edit`}>
                    <Pencil className="size-4" /> 수정
                  </Link>
                </Button>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={id} />
                  <Button variant="destructive" type="submit">
                    삭제
                  </Button>
                </form>
              </>
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {post.pinned && (
          <Badge>
            <Pin className="size-3" /> 고정
          </Badge>
        )}
        {post.category && <Badge variant="outline">{post.category}</Badge>}
        <span className="text-sm text-muted-foreground">
          {post.author?.name} · {formatDate(post.created_at, true)}
        </span>
      </div>

      <Card className="mb-6">
        <CardContent>
          {post.content && !isHtmlEmpty(post.content) ? (
            <div
              className="rich-content text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">(내용 없음)</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h3 className="font-semibold">
            댓글{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({comments?.length ?? 0})
            </span>
          </h3>
          <CommentForm postId={id} />
          <Separator />
          <div className="flex flex-col gap-3">
            {(comments?.length ?? 0) === 0 && (
              <EmptyStateCompact title="첫 댓글을 남겨보세요." />
            )}
            {(comments as (Comment & { author: { id: string; name: string } | null })[] | null)?.map(
              (c) => {
                const canDelete =
                  profile.role === "admin" || c.author_id === profile.id;
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {c.author?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.created_at, true)}
                        </span>
                        {canDelete && (
                          <form action={deleteComment}>
                            <input
                              type="hidden"
                              name="comment_id"
                              value={c.id}
                            />
                            <input type="hidden" name="post_id" value={id} />
                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              삭제
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{c.content}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
