export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-page-title">{title}</h1>
        {description && (
          <p className="mt-1 text-body-sm text-smoke-gray">{description}</p>
        )}
      </div>
      {action && (
        <div className="w-full shrink-0 sm:w-auto [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ash-gray bg-card py-16 text-center shadow-card">
      <p className="font-heading text-section-title">{title}</p>
      {description && (
        <p className="max-w-sm text-body-sm text-smoke-gray">{description}</p>
      )}
      {action}
    </div>
  );
}

/** 카드·섹션 내부용 컴팩트 빈 상태 */
export function EmptyStateCompact({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ash-gray bg-hint-of-sky/40 py-8 text-center">
      <p className="text-body-sm font-medium text-sidebar-text">{title}</p>
      {description && (
        <p className="max-w-sm text-caption text-smoke-gray">{description}</p>
      )}
      {action}
    </div>
  );
}
