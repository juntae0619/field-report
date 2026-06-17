import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리자 클라이언트 (service_role 키).
// 절대 브라우저로 노출하지 마세요 — NEXT_PUBLIC_ 접두사를 쓰지 않습니다.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
