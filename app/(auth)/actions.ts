"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthErrorLike = {
  code?: string;
  message: string;
  status?: number;
};

function logAuthError(action: string, error: AuthErrorLike) {
  console.error(`[auth:${action}]`, {
    code: error.code,
    message: error.message,
    status: error.status,
  });
}

function getSignupErrorMessage(error: AuthErrorLike) {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "signup_disabled" || message.includes("signups not allowed")) {
    return "현재 신규 가입이 비활성화되어 있습니다. 스터디 운영자에게 문의해주세요.";
  }
  if (code.includes("rate_limit") || message.includes("rate limit")) {
    return "가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }
  if (code === "email_address_invalid" || message.includes("invalid email")) {
    return "올바른 이메일 주소를 입력해주세요.";
  }
  if (
    code === "unexpected_failure" ||
    (error.status !== undefined && error.status >= 500) ||
    message.includes("database error")
  ) {
    return "회원가입 서버 설정에 문제가 있습니다. 운영자에게 문의해주세요.";
  }

  return "가입을 완료할 수 없습니다. 기존 계정이라면 비밀번호 찾기를 이용해주세요.";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL_PATTERN.test(email) || !password) {
    redirect(`/login?error=${encodeURIComponent("이메일과 비밀번호를 확인해주세요.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("이메일 또는 비밀번호가 올바르지 않습니다.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect(`/signup?error=${encodeURIComponent("이름을 입력해주세요.")}`);
  }
  if (!EMAIL_PATTERN.test(email)) {
    redirect(`/signup?error=${encodeURIComponent("올바른 이메일을 입력해주세요.")}`);
  }
  if (password.length < 12) {
    redirect(`/signup?error=${encodeURIComponent("비밀번호는 12자 이상이어야 합니다.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    logAuthError("signup", error);
    redirect(`/signup?error=${encodeURIComponent(getSignupErrorMessage(error))}`);
  }

  revalidatePath("/", "layout");

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해주세요.")}`
    );
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    redirect(`/forgot-password?error=${encodeURIComponent("올바른 이메일을 입력해주세요.")}`);
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    logAuthError("request-password-reset", error);
    const message =
      error.code?.includes("rate_limit") ||
      error.message.toLowerCase().includes("rate limit")
        ? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        : "비밀번호 재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.";
    redirect(`/forgot-password?error=${encodeURIComponent(message)}`);
  }

  redirect(
    `/forgot-password?message=${encodeURIComponent("가입된 계정이라면 비밀번호 재설정 메일이 발송됩니다.")}`
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (password.length < 12) {
    redirect(`/reset-password?error=${encodeURIComponent("비밀번호는 12자 이상이어야 합니다.")}`);
  }
  if (password !== passwordConfirm) {
    redirect(`/reset-password?error=${encodeURIComponent("비밀번호가 서로 일치하지 않습니다.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?error=${encodeURIComponent("재설정 링크가 만료되었습니다. 다시 요청해주세요.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logAuthError("update-password", error);
    redirect(`/reset-password?error=${encodeURIComponent("비밀번호를 변경하지 못했습니다. 다시 시도해주세요.")}`);
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/login?message=${encodeURIComponent("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.")}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
