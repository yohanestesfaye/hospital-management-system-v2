function PageHeader({
  title,
  description,
  action,
  eyebrow,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm font-medium text-blue-600">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;