"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

function optionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parse(formData: FormData) {
  const statusRaw = String(formData.get("status") ?? "candidate");
  const dealTypeRaw = String(formData.get("deal_type") ?? "none");
  const sourceUrlRaw = String(formData.get("source_url") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    auction_no: String(formData.get("auction_no") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    property_type: String(formData.get("property_type") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    status: ["candidate", "scheduled", "visited", "hold", "archived"].includes(statusRaw)
      ? statusRaw
      : "candidate",
    deal_type: ["sale", "jeonse", "monthly_rent", "auction", "public_auction", "other"].includes(dealTypeRaw)
      ? dealTypeRaw
      : null,
    asking_price_manwon: optionalNumber(formData, "asking_price_manwon"),
    monthly_rent_manwon: optionalNumber(formData, "monthly_rent_manwon"),
    maintenance_fee_manwon: optionalNumber(formData, "maintenance_fee_manwon"),
    exclusive_area_m2: optionalNumber(formData, "exclusive_area_m2"),
    building_year: optionalNumber(formData, "building_year"),
    households: optionalNumber(formData, "households"),
    source_url: /^https?:\/\//i.test(sourceUrlRaw) ? sourceUrlRaw : null,
  };
}

function validationError(values: ReturnType<typeof parse>) {
  if (!values.name) return "물건명 또는 단지명을 입력해주세요.";
  if (values.name.length > 200) return "물건명은 200자 이하로 입력해주세요.";
  if (values.exclusive_area_m2 !== null && values.exclusive_area_m2 <= 0) {
    return "전용면적은 0보다 커야 합니다.";
  }
  if (
    values.building_year !== null &&
    (!Number.isInteger(values.building_year) || values.building_year < 1800 || values.building_year > 2100)
  ) {
    return "준공연도는 1800년부터 2100년 사이로 입력해주세요.";
  }
  if (values.households !== null && (!Number.isInteger(values.households) || values.households < 0)) {
    return "세대수는 0 이상의 정수로 입력해주세요.";
  }
  return null;
}

function parseRating(raw: FormDataEntryValue | null) {
  const value = Number(String(raw ?? "0"));
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export async function createProperty(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const values = parse(formData);
  const invalid = validationError(values);
  if (invalid) {
    redirect(`/properties/new?error=${encodeURIComponent(invalid)}`);
  }

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
  const profile = await requireProfile();
  const supabase = await createClient();
  const values = parse(formData);
  const invalid = validationError(values);
  if (invalid) {
    redirect(`/properties/${id}/edit?error=${encodeURIComponent(invalid)}`);
  }

  const { data: property } = await supabase
    .from("properties")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();
  if (!property || (profile.role !== "admin" && property.created_by !== profile.id)) {
    redirect(`/properties/${id}?error=${encodeURIComponent("수정 권한이 없습니다.")}`);
  }

  const { error } = await supabase.from("properties").update(values).eq("id", id);
  if (error) {
    redirect(`/properties/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  redirect(`/properties/${id}`);
}

export async function deleteProperty(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const { data: property } = await supabase
    .from("properties")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();
  if (!property || (profile.role !== "admin" && property.created_by !== profile.id)) return;

  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/properties");
  redirect("/properties");
}

export async function addPropertyFeedback(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const propertyId = String(formData.get("property_id"));
  const content = String(formData.get("content") ?? "").trim();
  const rating = parseRating(formData.get("rating"));
  if (!content || content.length > 2000) return;

  await supabase.from("feedbacks").insert({
    property_id: propertyId,
    author_id: profile.id,
    content,
    rating,
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyFeedback(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("feedback_id"));
  const propertyId = String(formData.get("property_id"));
  const { data: feedback } = await supabase
    .from("feedbacks")
    .select("author_id, property_id")
    .eq("id", id)
    .maybeSingle();
  if (
    !feedback ||
    feedback.property_id !== propertyId ||
    (profile.role !== "admin" && feedback.author_id !== profile.id)
  ) return;

  await supabase.from("feedbacks").delete().eq("id", id);
  revalidatePath(`/properties/${propertyId}`);
}
