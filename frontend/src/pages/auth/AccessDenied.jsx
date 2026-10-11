import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AccessDenied() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Access Restricted
        </h1>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          You do not have the required permissions to access this clinical or
          administrative module.
          {user?.role && (
            <span className="block mt-2 font-medium text-slate-700">
              Current Role:{" "}
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs uppercase tracking-wider font-semibold">
                {user.role}
              </span>
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
