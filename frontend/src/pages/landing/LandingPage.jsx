import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldPlus,
  ArrowRight,
  Play,
  Calendar,
  CalendarCheck,
  Stethoscope,
  FileText,
  BarChart3,
  Hospital,
  Activity,
  ShieldCheck,
  Building2,
  Users,
  FlaskConical,
  Pill,
  CreditCard,
  CheckCircle2,
  Menu,
  X,
  Lock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import heroDoctorImg from "../../assets/hms_hero_doctor.jpg";

function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const featureCards = [
    {
      id: "patients",
      icon: Calendar,
      iconBg: "bg-blue-50 text-blue-600 ring-blue-100",
      title: "Patient Registration",
      description: "Quick and easy patient onboarding, search, and demographic profiling.",
    },
    {
      id: "appointments",
      icon: CalendarCheck,
      iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      title: "Appointment Scheduling",
      description: "Reduce waiting time and improve patient satisfaction with active queues.",
    },
    {
      id: "doctors",
      icon: Stethoscope,
      iconBg: "bg-purple-50 text-purple-600 ring-purple-100",
      title: "Doctor Management",
      description: "Specialist directories, shift coverage, and departmental assignments.",
    },
    {
      id: "records",
      icon: FileText,
      iconBg: "bg-amber-50 text-amber-600 ring-amber-100",
      title: "Electronic Health Records",
      description: "Secure, synchronized clinical histories, diagnoses, and prescriptions.",
    },
    {
      id: "reports",
      icon: BarChart3,
      iconBg: "bg-teal-50 text-teal-600 ring-teal-100",
      title: "Reports & Analytics",
      description: "Make data-driven decisions with real-time operational and clinical insights.",
    },
  ];

  const operationalModules = [
    {
      role: "Doctors & Clinical Staff",
      icon: Stethoscope,
      title: "Consultations & Clinical Care",
      desc: "Manage patient histories, diagnosis coding, vital observations, and digital prescriptions in a unified interface.",
    },
    {
      role: "Laboratory Technicians",
      icon: FlaskConical,
      title: "Diagnostic Lab Automation",
      desc: "Track pending lab requests, record blood/specimen results, and verify diagnostic reports directly for physicians.",
    },
    {
      role: "Pharmacists",
      icon: Pill,
      title: "Pharmacy & Dispensary",
      desc: "Review active prescriptions, track medicine stock inventories, verify expiration batches, and record dispensations.",
    },
    {
      role: "Finance & Accounting",
      icon: CreditCard,
      title: "Invoices & Revenue Ledger",
      desc: "Automated billing calculations, patient itemized statements, and payment status tracking.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION BAR (Slim 64px)                        */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand Identity - HMS V2 */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-700 transition">
              <Hospital size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  HMS <span className="text-blue-600">V2</span>
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 hidden sm:block">
                Hospital Management System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#home"
              className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Features
            </a>
            <a
              href="#modules"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Modules
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Security
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Contact
            </a>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-slate-500 font-medium hidden lg:inline mr-1">
                  Signed in as <strong className="text-slate-800 capitalize">{user?.role}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Dashboard
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-blue-500/70 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition active:scale-[0.99]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2.5 pb-5 space-y-2.5">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-blue-600 rounded-lg bg-blue-50"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Features
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Modules
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Security
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Contact
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl border border-blue-500 text-sm font-semibold text-blue-600"
              >
                Login
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl bg-blue-600 text-sm text-white font-semibold shadow-md shadow-blue-500/20"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION (Compact, Viewport-Optimized)            */}
      {/* ======================================================== */}
      <section id="home" className="relative overflow-hidden bg-white pt-6 pb-8 lg:pt-9 lg:pb-10">
        {/* Soft background ambient gradient lights */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/4 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 right-10 h-80 w-80 rounded-full bg-teal-100/35 blur-3xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headlines & Actions (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              {/* Healthcare Platform Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                <ShieldPlus size={15} className="text-blue-600 stroke-[2.2]" />
                <span>Hospital Management System</span>
              </div>

              {/* Bold Hero Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-5xl font-black tracking-tight text-slate-900 leading-[1.14]">
                Smarter Healthcare
                <br />
                Management for a
                <br />
                <span className="text-blue-600">Healthier Tomorrow</span>
              </h1>

              {/* Supporting Description */}
              <p className="max-w-lg text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Streamline your hospital operations, improve patient care, and manage your resources efficiently — all in one powerful and easy-to-use platform.
              </p>

              {/* Primary & Secondary Call-to-Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition active:scale-[0.99]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={17} />
                </Link>

                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm sm:text-base font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition shadow-2xs"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Play size={11} className="ml-0.5 fill-blue-600" />
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-teal-600" />
                  <span>8 Verified Roles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>HIPAA & SOC 2 Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={15} className="text-indigo-600" />
                  <span>Live Department Sync</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Imagery (5 cols on lg) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow ring */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-blue-600/20 via-teal-500/15 to-transparent blur-lg"
                />

                {/* Main Hero Card Container - Perfectly Framed 4:3 Aspect */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 aspect-[4/3] max-h-[380px] lg:max-h-[410px]">
                  <img
                    src={heroDoctorImg}
                    alt="Professional female physician with digital medical tablet in modern hospital"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />

                  {/* Overlay hospital badge matching reference */}
                  <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-2.5 shadow-md max-w-[160px] hidden sm:block">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight">
                      Better Systems.
                      <br />
                      Better Care.
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-teal-600">
                      <Activity size={13} className="animate-pulse" />
                      <span className="text-[10px] font-semibold text-slate-500">Live Hospital Sync</span>
                    </div>
                  </div>

                  {/* Floating Provider Badge at Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 p-2.5 shadow-md flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        Central Medical Center
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Clinical workflows active
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. FEATURE STRIP (Compact 5-column Bar)                  */}
      {/* ======================================================== */}
      <section id="features" className="bg-slate-100/80 border-y border-slate-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {featureCards.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ring-1 mb-3 ${feat.iconBg}`}
                    >
                      <IconComponent size={19} className="stroke-[2.2]" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CLINICAL WORKSPACE MODULES SHOWCASE                   */}
      {/* ======================================================== */}
      <section id="modules" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Comprehensive Platform
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5 sm:text-3xl">
              Engineered for Complete Hospital Coordination
            </h2>
            <p className="mt-2.5 text-slate-600 text-xs sm:text-sm">
              Synchronize doctor appointments, electronic medical records, diagnostic lab tests, pharmacy inventory, and accounting across departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {operationalModules.map((mod, idx) => {
              const IconComp = mod.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mb-3">
                      {mod.role}
                    </span>
                    <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2.5 shadow-2xs">
                      <IconComp size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/70">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <span>Access workspace</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SECURITY & ROLE GOVERNANCE                            */}
      {/* ======================================================== */}
      <section id="security" className="py-14 bg-slate-950 text-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-full border border-teal-500/30">
                Institutional Security Standard
              </span>
              <h2 className="text-2xl font-extrabold sm:text-3xl text-white">
                Multi-Role Authorization & Protected Health Information
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                HMS V2 protects clinical privacy with strict role-based access control, PostgreSQL data integrity constraints, bcrypt password cryptography, and verified JWT tokens.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-xl font-black text-blue-400">8</p>
                  <p className="text-[11px] text-slate-400 font-medium">Distinct Roles</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-xl font-black text-teal-400">256</p>
                  <p className="text-[11px] text-slate-400 font-medium">Bit SSL Security</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-xl font-black text-indigo-400">17</p>
                  <p className="text-[11px] text-slate-400 font-medium">Database Tables</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-xl font-black text-emerald-400">100%</p>
                  <p className="text-[11px] text-slate-400 font-medium">Audit Passed</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Granular Privilege Matrix</h4>
                  <p className="text-[11px] text-slate-400">Server-enforced access per endpoint</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-800 text-[11px]">
                  <span>Doctors & Nurses</span>
                  <span className="text-teal-400 font-mono">EMR, Patients, Prescriptions</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800 text-[11px]">
                  <span>Pharmacists</span>
                  <span className="text-blue-400 font-mono">Medicine Stock, Dispensing</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800 text-[11px]">
                  <span>Laboratory Technicians</span>
                  <span className="text-purple-400 font-mono">Diagnostic Orders & Results</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800 text-[11px]">
                  <span>Accountants</span>
                  <span className="text-amber-400 font-mono">Billing Invoices & Ledgers</span>
                </div>
              </div>

              <div className="pt-1.5">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  <span>Authenticate to Portal</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FOOTER                                                */}
      {/* ======================================================== */}
      <footer id="contact" className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Brand */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-white">
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Hospital size={16} />
                </div>
                <span className="text-base font-bold">HMS V2</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hospital Management System enterprise platform for connected clinical workflows, EMR records, and departmental operations.
              </p>
            </div>

            {/* Column 2: Clinical Modules */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Clinical Modules
              </p>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/login" className="hover:text-white transition">Patient Records</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Doctor Scheduling</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Appointments Queue</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Prescription Management</Link></li>
              </ul>
            </div>

            {/* Column 3: Diagnostics & Supply */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Diagnostics & Supply
              </p>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/login" className="hover:text-white transition">Laboratory Tests & Orders</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Pharmacy Dispensing</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Medicine Inventory</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Billing & Invoices</Link></li>
              </ul>
            </div>

            {/* Column 4: Institutional Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Hospital Administration
              </p>
              <p className="text-xs leading-relaxed text-slate-400">
                Hospital Management Suite v2.4.0
                <br />
                Connected to Supabase PostgreSQL
                <br />
                Addis Ababa, Ethiopia
              </p>
              <div className="mt-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300"
                >
                  <span>Staff Portal Login</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5">
            <p>© 2026 HMS V2 • Hospital Management System. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>HIPAA Compliant</span>
              <span>•</span>
              <span>256-Bit SSL</span>
              <span>•</span>
              <span>Role-Based Access</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 7. WATCH DEMO MODAL                                      */}
      {/* ======================================================== */}
      {demoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Play size={16} className="fill-blue-600 ml-0.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">HMS V2 Platform Tour</h3>
                <p className="text-xs text-slate-500">Live Hospital Management System</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              HMS V2 coordinates 8 hospital departments through a unified PostgreSQL-backed architecture. Sign in through the staff portal to explore live clinical and administrative workflows:
            </p>

            <div className="space-y-2 mb-5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span><strong>Admin:</strong> Global statistics, system health, departments, doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span><strong>Doctor & Nurse:</strong> Consultation notes, prescriptions, diagnosis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span><strong>Lab Tech:</strong> Blood test panels, results entry, verified status</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span><strong>Pharmacist:</strong> Prescription fulfillment, stock inventory ledger</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoModalOpen(false);
                  navigate("/login");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <span>Launch Portal</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
