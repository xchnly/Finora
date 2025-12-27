import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* NAVBAR */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
            <span className="text-white font-bold text-lg leading-none">F</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Finora
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Smart Finance Management
              </span>
            </div>

            <h2 className="text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
              Take Control of
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your Money
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Kelola banyak wallet, pantau budget bulanan, cicilan, dan nilai
              kesehatan keuanganmu — semua dalam satu dashboard yang simpel dan
              bisa dicustom.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                Mulai Gratis
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-blue-200 bg-white/80 px-8 py-4 font-semibold text-blue-700 backdrop-blur-sm hover:bg-white hover:border-blue-300 transition-all duration-200"
              >
                Sudah Punya Akun
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-500"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Bergabung dengan 10.000+ pengguna
                </p>
                <p className="text-sm text-slate-500">
                  Rated 4.8/5 dari 2.000+ review
                </p>
              </div>
            </div>
          </div>

          {/* MOCKUP DASHBOARD */}
          <div className="relative">
            <div className="absolute -right-6 -top-6 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 opacity-50 blur-3xl" />
            <div className="relative rounded-3xl border border-blue-100 bg-white/80 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Dashboard Overview
                  </h3>
                  <p className="text-sm text-slate-500">Last updated: Today</p>
                </div>
                <div className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2">
                  <span className="text-sm font-semibold text-blue-700">
                    Current Month
                  </span>
                </div>
              </div>

              {/* Health Score */}
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Financial Health
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Excellent
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Score: <b>78 / 100</b>
                    </span>
                    <span className="font-medium text-blue-600">
                      +5.2% from last month
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <div className="h-2 w-5 bg-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        Total Balance
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-800">
                        Rp 12.45M
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1 w-full bg-blue-100">
                    <div className="h-1 w-3/4 bg-gradient-to-r from-blue-400 to-blue-500" />
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2">
                      <div className="h-2 w-5 bg-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-indigo-600">
                        Budget Used
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-800">
                        68%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1 w-full bg-indigo-100">
                    <div className="h-1 w-2/3 bg-gradient-to-r from-indigo-400 to-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Quick Actions
                </p>
                <div className="mt-3 flex gap-3">
                  <button className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm hover:shadow transition-all">
                    Add Transaction
                  </button>
                  <button className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm hover:shadow transition-all">
                    Set Budget
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}
              Master Your Finances
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Powerful features designed to give you complete control and insight
            into your financial life
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <ModernFeature
            title="Multi Wallet"
            desc="Kelola cash, bank, e-wallet, dan kartu kredit dalam satu tempat dengan sinkronisasi real-time."
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            gradient="from-blue-500 to-cyan-500"
          />
          <ModernFeature
            title="Smart Budgeting"
            desc="Atur budget per kategori dan pantau progresnya secara real-time dengan AI-powered insights."
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            gradient="from-indigo-500 to-purple-500"
          />
          <ModernFeature
            title="Financial Health"
            desc="Nilai kesehatan keuangan kamu dengan indikator yang jelas dan rekomendasi personalisasi."
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            gradient="from-cyan-500 to-blue-500"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-blue-100 bg-white/50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700" />
              <span className="text-xl font-bold text-slate-900">Finora</span>
            </div>
            <div className="flex gap-8">
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Finora. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function ModernFeature({
  title,
  desc,
  icon,
  gradient,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className={`mb-6 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="mt-3 text-slate-600">{desc}</p>

      <div className="mt-6 h-0.5 w-12 bg-gradient-to-r from-blue-500 to-transparent" />
    </div>
  );
}
