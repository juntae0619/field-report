import Link from "next/link";
import { Plus, Pin, MessageSquare } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function BoardPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, pinned, created_at, author:profiles(name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="게시판"
        description="공지, 자료 공유, 자유 토론 공간입니다."
        action={
          <Button asChild>
            <Link href="/board/new">
              <Plus className="size-4" /> 글쓰기
            </Link>
          </Button>
        }
      />

      {(posts?.length ?? 0) === 0 ? (
        <EmptyState
          title="게시글이 없습니다"
          description="첫 게시글을 작성해보세요."
          action={
            <Button asChild className="mt-1">
              <Link href="/board/new">
                <Plus className="size-4" /> 글쓰기
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {posts?.map((p) => {
            const author = p.author as unknown as { name: string } | null;
            return (
              <Link key={p.id} href={`/board/${p.id}`}>
                <Card className="py-3.5 hover-row">
                  <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {p.pinned && (
                        <Pin className="size-4 shrink-0 text-sidebar-icon" />
                      )}
                      {p.category && (
                        <Badge variant="outline" className="shrink-0">
                          {p.category}
                        </Badge>
                      )}
                      <span className="truncate font-medium">{p.title}</span>
                    </div>
                    <span className="text-xs text-smoke-gray sm:shrink-0">
                      {author?.name} · {formatDate(p.created_at)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
