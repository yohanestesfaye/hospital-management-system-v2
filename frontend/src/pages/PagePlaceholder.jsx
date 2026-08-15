import DashboardLayout from "../components/layout/DashboardLayout";

function PagePlaceholder({ title, description }) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">
            HMS Module
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>

          <div className="mt-6 rounded-lg bg-slate-50 p-6 text-sm text-slate-500">
            This module will be implemented in a later development milestone.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PagePlaceholder;