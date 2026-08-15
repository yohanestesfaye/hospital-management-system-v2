function Card({
  children,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="font-semibold text-slate-900">
                {title}
              </h3>
            )}

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      <div className="p-5">{children}</div>
    </section>
  );
}

export default Card;