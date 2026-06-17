import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hint-of-sky px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-sidebar-active shadow-sm">
            <Building2 className="size-6 text-white" />
          </div>
          <h1 className="font-heading text-xl font-bold text-deep-space-charcoal">
            임장 스터디 관리
          </h1>
          <p className="mt-1 text-body-sm text-smoke-gray">
            함께하는 부동산 임장 스터디
          </p>
        </div>
        {children}
        <p className="mt-6 text-center text-caption text-smoke-gray">
          계정 문의는 스터디 운영자에게 연락해주세요
        </p>
      </div>
    </div>
  );
}
