import Link from "next/link";
import { ArrowRight, Sparkles, Shield, TrendingUp, Zap, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-r from-blue-200/20 to-indigo-200/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-60 w-60 rounded-full bg-gradient-to-r from-sky-200/10 to-cyan-200/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/3 h-40 w-40 rounded-full bg-gradient-to-r from-violet-200/10 to-purple-200/10 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 mx-auto max-w-7xl px-6 py-6 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 blur-sm" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Finora
            </h1>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all duration-200 md:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 shadow-sm">
              <div className="flex h-2 w-2">
                <div className="absolute h-2 w-2 animate-ping rounded-full bg-blue-500" />
                <div className="relative h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">
                AI-Powered Finance Management
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
              Smarter
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Financial
                </span>
                <Sparkles className="absolute -right-8 top-0 h-8 w-8 text-yellow-400" />
              </span>
              <br />
              Decisions
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600 md:text-xl">
              Transform your financial life with intelligent insights, automated tracking, 
              and personalized recommendations—all in one beautiful dashboard.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-3">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/demo"
                className="rounded-xl border border-slate-200 bg-white/80 px-8 py-4 font-semibold text-slate-700 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-200"
              >
                Watch Demo
              </Link>
            </div>

            <div className="mt-12">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="relative h-12 w-12 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Trusted by 10,000+ users worldwide
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">4.8/5 from 2,000+ reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ENHANCED MOCKUP DASHBOARD */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-r from-blue-200/30 to-indigo-200/30 blur-3xl" />
              
              {/* Dashboard Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Financial Dashboard
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">Updated in real-time</p>
                </div>
                <div className="rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 ring-1 ring-blue-100">
                  <span className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    +12.5% this month
                  </span>
                </div>
              </div>

              {/* Health Score Card */}
              <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Financial Health Score</p>
                    <h4 className="text-3xl font-bold">78</h4>
                    <p className="text-sm text-slate-400">/100</p>
                  </div>
                  <div className="rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-1000"
                      style={{ width: '78%' }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Excellent</span>
                    <span className="font-medium text-emerald-400">+5.2% from last month</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 p-5 ring-1 ring-blue-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600">Total Balance</p>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        $12.45M
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Monthly Growth</span>
                      <span className="font-semibold text-green-600">+8.2%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-blue-100">
                      <div className="h-1.5 w-3/4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/80 p-5 ring-1 ring-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-indigo-600">Budget Used</p>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        68%
                      </p>
                    </div>
                    <div className="rounded-lg bg-indigo-100 p-2">
                      <Shield className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Remaining</span>
                      <span className="font-semibold text-indigo-600">$2,340</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-indigo-100">
                      <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-5 ring-1 ring-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">AI Recommendation</p>
                    <p className="text-xs text-slate-500">Reduce dining out by 15% to save $420/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">
            Powerful Features
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              For Modern Finance
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Everything you need to take control of your financial future
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <EnhancedFeature
            title="Multi-Wallet Management"
            desc="Seamlessly manage cash, bank accounts, e-wallets, and credit cards with real-time synchronization."
            icon={<Zap className="h-6 w-6" />}
            gradient="from-blue-500 to-cyan-500"
            highlights={["Real-time sync", "Unlimited accounts", "Smart categorization"]}
          />
          <EnhancedFeature
            title="AI Budgeting"
            desc="Intelligent budget planning with predictive analytics and personalized spending recommendations."
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="from-indigo-500 to-purple-500"
            highlights={["AI predictions", "Auto-adjusting", "Goal tracking"]}
          />
          <EnhancedFeature
            title="Financial Health"
            desc="Comprehensive health scoring with actionable insights to improve your financial wellbeing."
            icon={<Shield className="h-6 w-6" />}
            gradient="from-cyan-500 to-blue-500"
            highlights={["Health scoring", "Risk analysis", "Improvement plans"]}
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-16 text-center">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl" />
          
          <div className="relative">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Ready to Transform
              <br />
              Your Finances?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Join thousands who&apos;ve already taken control of their financial future
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group relative overflow-hidden rounded-xl bg-white px-8 py-4 font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-3">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
              >
                Book a Demo
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-slate-400">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ENHANCED FOOTER */}
      <footer className="border-t border-slate-200 bg-white/50 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">Finora</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Smarter financial decisions for everyone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900">Product</h4>
              <div className="mt-4 space-y-3">
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Features
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Pricing
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  API
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900">Company</h4>
              <div className="mt-4 space-y-3">
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  About
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Careers
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Contact
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900">Legal</h4>
              <div className="mt-4 space-y-3">
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Privacy
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Terms
                </a>
                <a href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Security
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 border-t border-slate-200 pt-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <p className="text-sm text-slate-600">
                © {new Date().getFullYear()} Finora. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function EnhancedFeature({
  title,
  desc,
  icon,
  gradient,
  highlights,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  highlights: string[];
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg shadow-blue-500/5 ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className={`mb-6 inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg`}>
          {icon}
        </div>
        
        <h3 className="text-xl font-bold text-slate-800">
          {title}
        </h3>
        <p className="mt-3 text-slate-600">
          {desc}
        </p>
        
        <div className="mt-6 space-y-2">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-700">{highlight}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 h-0.5 w-16 bg-gradient-to-r from-blue-500/50 to-transparent transition-all duration-300 group-hover:w-24" />
      </div>
    </div>
  );
}