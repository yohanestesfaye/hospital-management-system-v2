import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hospital,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);

      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.message);
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* Left side */}
        <div className="hidden w-1/2 bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                <Hospital size={22} />
              </div>

              <div>
                <p className="font-bold">HMS</p>
                <p className="text-xs text-blue-100">
                  Hospital Management System
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium text-blue-100">
              Healthcare management
            </p>

            <h1 className="text-4xl font-bold leading-tight">
              Manage your hospital from one powerful platform.
            </h1>

            <p className="mt-5 text-base leading-7 text-blue-100">
              Manage patients, doctors, appointments, medical
              records, laboratory services, pharmacy, billing,
              and hospital operations.
            </p>
          </div>

          <p className="text-sm text-blue-100">
            © 2026 Hospital Management System
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Hospital size={22} />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  HMS
                </p>

                <p className="text-xs text-slate-500">
                  Hospital Management System
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to access your hospital dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="admin@hms.com"
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Sign in
                {!loading && <ArrowRight size={17} />}
              </Button>
            </form>

            {/* Development credentials */}
            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-800">
                Development login
              </p>

              <p className="mt-2 text-xs text-blue-700">
                Email: admin@hms.com
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Password: admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;