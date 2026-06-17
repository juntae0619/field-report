"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

function parse(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    auction_no: String(formData.get("auction_no") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    property_type: String(formData.get("property_type") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createProperty(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const values = parse(formData);
  if (!values.name) return;

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...values, created_by: profile.id })
    .select("id")
    .single();

  if (error) {
    redirect(`/properties/new?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/properties");
  redirect(`/properties/${data!.id}`);
}

export async function updateProperty(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("properties").update(parse(formData)).eq("id", id);
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  redirect(`/properties/${id}`);
}

export async function deleteProperty(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/properties");
  redirect("/properties");
}

export async function addPropertyFeedback(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const propertyId = String(formData.get("property_id"));
  const content = String(formData.get("content") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "0");
  if (!content) return;

  await supabase.from("feedbacks").insert({
    property_id: propertyId,
    author_id: profile.id,
    content,
    rating: Number(ratingRaw) || null,
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyFeedback(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("feedback_id"));
  const propertyId = String(formData.get("property_id"));
  await supabase.from("feedbacks").delete().eq("id", id);
  revalidatePath(`/properties/${propertyId}`);
}
