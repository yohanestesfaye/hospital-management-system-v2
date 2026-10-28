import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hospital,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Stethoscope,
  FlaskConical,
  Pill,
  Users,
  CreditCard,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Pre-configured development test accounts for seamless role verification
const DEV_ACCOUNTS = [
  { role: "Admin", email: "admin@hms.com", pass: "admin123", icon: Building2 },
  { role: "Doctor", email: "dr.hana@hms.com", pass: "Doctor@123", icon: Stethoscope },
  { role: "Nurse", email: "nurse.sara@hms.com", pass: "Nurse@123", icon: Activity },
  { role: "Receptionist", email: "rec.dawit@hms.com", pass: "Rec@123", icon: Users },
  { role: "Pharmacist", email: "pharma.tigist@hms.com", pass: "Pharma@123", icon: Pill },
  { role: "Lab Tech", email: "lab.aman@hms.com", pass: "Lab@123", icon: FlaskConical },
  { role: "Accountant", email: "acc.meron@hms.com", pass: "Account@123", icon: CreditCard },
];

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem("hms_remember_email") || "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem("hms_remember_email"));
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please provide both your institutional email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("hms_remember_email", email.trim());
        } else {
          localStorage.removeItem("hms_remember_email");
        }
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.message || "Invalid credentials. Please verify your email and password.");
      }
    } catch {
      setError("Unable to connect to hospital server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* ======================================================== */}
      {/* LEFT PANEL: Healthcare ERP Brand & Clinical Platform     */}
      {/* ======================================================== */}
      <aside className="relative hidden w-full lg:flex lg:w-5/12 xl:w-5/12 flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-14 text-white border-r border-slate-800/80">
        {/* Ambient background lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl"
        />

        {/* Abstract micro-grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header / System Identity */}
        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Hospital size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">HMS V2</span>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-300 ring-1 ring-blue-400/30 uppercase">
                  Enterprise
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">Hospital Management Suite</p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Online</span>
          </div>
        </header>

        {/* Core Value Proposition & Module Highlights */}
        <div className="relative z-10 my-auto py-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3.5 py-1 text-xs font-medium text-teal-300 ring-1 ring-teal-500/30 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Clinical & Operational ERP Platform
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl xl:text-5xl leading-[1.18]">
            Better Healthcare.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-teal-400 bg-clip-text text-transparent">
              Unified Management.
            </span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 font-normal">
            Enterprise clinical governance, electronic medical records, laboratory diagnostics, and financial management unified in one secure system.
          </p>

          {/* ERP Module Badges */}
          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3.5 rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-150 hover:bg-slate-900/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Integrated Clinical Care & EMR</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Connected patient consultations, doctor schedules, digital prescriptions, and vital histories.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-150 hover:bg-slate-900/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                <Layers size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Diagnostics & Pharmacy Automation</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Real-time laboratory orders, test results, pharmacy dispensaries, and batch inventory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-150 hover:bg-slate-900/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Role-Based Access & Billing Control</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Strict multi-tier authorization for 8 hospital roles, automated invoices, and audit logging.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Compliance Notice */}
        <footer className="relative z-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>© 2026 HMS V2. All rights reserved.</span>
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-400" />
            HIPAA & SOC 2 Ready
          </span>
        </footer>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT PANEL: Enterprise Authentication Card & Workspace  */}
      {/* ======================================================== */}
      <main className="flex flex-1 flex-col justify-center items-center px-4 py-10 sm:px-8 lg:px-12 bg-slate-100 min-h-screen">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/25">
            <Hospital size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-slate-900 leading-tight">HMS V2</p>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500">Hospital Management System</p>
          </div>
        </div>

        {/* Crisp Elevated Enterprise Card */}
        <div className="w-full max-w-[460px] rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-10 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5">
          {/* Card Title & Institutional Context */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                <Hospital size={14} />
                Staff & Provider Portal
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                v2.4.0 Production
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your institutional credentials to access your hospital workspace.
            </p>
          </div>

          {/* Inline Error Banner */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-800"
            >
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Institutional Email <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center z-10"
                >
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@hospital.com"
                  required
                  disabled={loading}
                  style={{ paddingLeft: "2.85rem" }}
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/15 hover:border-slate-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center z-10"
                >
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your security password"
                  required
                  disabled={loading}
                  style={{ paddingLeft: "2.85rem", paddingRight: "2.85rem" }}
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/15 hover:border-slate-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-12 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-600"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Remember institutional email on this workstation
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full mt-2 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-150 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-600/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Development Quick-Fill Role Switcher */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <details className="group">
                <summary className="flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" />
                    Quick Role Sign-In
                  </span>
                  <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 group-open:bg-blue-50 group-open:text-blue-700 group-open:border-blue-200">
                    Local Dev Only
                  </span>
                </summary>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {DEV_ACCOUNTS.map((acc) => {
                    const IconComp = acc.icon;
                    const isSelected = email === acc.email;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleQuickFill(acc.email, acc.pass)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors duration-150 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <IconComp size={15} className={isSelected ? "text-blue-600" : "text-slate-500"} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold leading-tight">{acc.role}</p>
                          <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Security & compliance reassurance */}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck size={15} className="text-teal-600" />
            <span>256-Bit SSL Encrypted • Role-Based Access Control</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Protected Health Information (PHI) system. Unauthorized access is monitored and strictly prohibited.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;