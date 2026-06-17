"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { sanitizeHtml, isHtmlEmpty } from "@/lib/sanitize";

export async function createPost(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("content") ?? "");
  const content = isHtmlEmpty(rawContent) ? "" : sanitizeHtml(rawContent);
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!title) return;

  const { data, error } = await supabase
    .from("posts")
    .insert({ title, content, category, author_id: profile.id })
    .select("id")
    .single();
  if (error) {
    redirect(`/board/new?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/board");
  redirect(`/board/${data!.id}`);
}

export async function updatePost(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("content") ?? "");
  const content = isHtmlEmpty(rawContent) ? "" : sanitizeHtml(rawContent);
  const category = String(formData.get("category") ?? "").trim() || null;

  await supabase.from("posts").update({ title, content, category }).eq("id", id);
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  redirect(`/board/${id}`);
}

export async function deletePost(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/board");
  redirect("/board");
}

export async function togglePin(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") return;
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const pinned = String(formData.get("pinned")) === "true";
  await supabase.from("posts").update({ pinned: !pinned }).eq("id", id);
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
}

export async function addComment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const postId = String(formData.get("post_id"));
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: profile.id, content });
  revalidatePath(`/board/${postId}`);
}

export async function deleteComment(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("comment_id"));
  const postId = String(formData.get("post_id"));
  await supabase.from("comments").delete().eq("id", id);
  revalidatePath(`/board/${postId}`);
}
