"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { 
  doc, 
  getDoc, 
  Timestamp, 
  onSnapshot, 
  collection 
} from "firebase/firestore";

import {
  Home,
  Wallet,
  Layers,
  Receipt,
  BarChart3,
  CreditCard,
  Activity,
  Settings,
} from "lucide-react";

const menus = [
  {
    name: "Overview",
    path: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Wallets",
    path: "/dashboard/wallets",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    name: "Categories",
    path: "/dashboard/categories",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    name: "Transactions",
    path: "/dashboard/transactions",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    name: "Budgets",
    path: "/dashboard/budgets",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: "Cicilan",
    path: "/dashboard/loans",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    name: "Financial Health",
    path: "/dashboard/health",
    icon: <Activity className="h-5 w-5" />,
  },
];

interface UserData {
  name: string;
  email: string;
  createdAt: Timestamp | Date;
}

// Mobile Header Component - Hanya untuk mobile
function MobileHeader({
  currentMenu,
  onMenuClick,
}: {
  currentMenu: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-blue-100 bg-white shadow-sm md:hidden">
      <div className="flex items-center justify-between p-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-blue-50"
        >
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 ml-4">
          <h1 className="text-lg font-bold text-slate-900">{currentMenu}</h1>
        </div>

        {/* Logo kecil */}
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center ml-2">
          <span className="text-white font-bold text-xs">F</span>
        </div>
      </div>
    </header>
  );
}

// Mobile Sidebar Drawer - Hanya untuk mobile
function MobileSidebarDrawer({
  isOpen,
  onClose,
  pathname,
  handleLogout,
  userData,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  handleLogout: () => void;
  userData: UserData | null;
  loading: boolean;
}) {
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        md:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex h-full flex-col p-4">
          {/* Header dengan user info */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {loading ? "U" : getInitials(userData?.name || "U")}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {loading ? "Loading..." : userData?.name || "User Account"}
                </p>
                <p className="text-xs text-slate-500">
                  {loading ? "loading..." : userData?.email || "user@email.com"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-50 rounded-lg"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {/* MENU UTAMA (5) */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu Utama
            </p>
            {menus.slice(0, 5).map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  pathname === menu.path
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span
                  className={
                    pathname === menu.path ? "text-white" : "text-blue-500"
                  }
                >
                  {menu.icon}
                </span>
                {menu.name}
              </Link>
            ))}

            {/* ANALISIS (2) */}
            <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Analisis
            </p>
            {menus.slice(5, 7).map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  pathname === menu.path
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span
                  className={
                    pathname === menu.path ? "text-white" : "text-blue-500"
                  }
                >
                  {menu.icon}
                </span>
                {menu.name}
              </Link>
            ))}
          </nav>

          {/* Logout & Help */}
          <div className="mt-auto space-y-4 border-t border-blue-100 pt-6">
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>

            <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4">
              <p className="text-xs font-medium text-blue-700">
                Butuh bantuan?
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Hubungi support kami
              </p>
              <button className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                Kontak Support
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Fungsi untuk mengirim reminder cicilan (placeholder)
const triggerLoanReminder = async ({
  loanId,
  loanName,
  dueDay,
  month,
  amount,
}: {
  loanId: string;
  loanName: string;
  dueDay: number;
  month: string;
  amount: number;
}) => {
  console.log("Loan reminder triggered:", {
    loanId,
    loanName,
    dueDay,
    month,
    amount,
  });
  // Implementasi sebenarnya bisa menggunakan email, push notification, dll.
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              name: data.name || currentUser.displayName || "User",
              email: data.email || currentUser.email || "user@email.com",
              createdAt: data.createdAt || new Date(),
            });
          } else {
            setUserData({
              name: currentUser.displayName || "User",
              email: currentUser.email || "user@email.com",
              createdAt: new Date(),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Gagal mengambil data pengguna");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsub = onSnapshot(
      collection(db, "users", currentUser.uid, "loans"),
      (loanSnap) => {
        loanSnap.docs.forEach((loanDoc) => {
          const loan = loanDoc.data();

          const scheduleUnsub = onSnapshot(
            collection(db, "users", currentUser.uid, "loans", loanDoc.id, "schedules"),
            (scheduleSnap) => {
              scheduleSnap.docs.forEach((s) => {
                const schedule = s.data();

                if (!schedule.paid) {
                  triggerLoanReminder({
                    loanId: loanDoc.id,
                    loanName: loan.name,
                    dueDay: loan.dueDay,
                    month: schedule.month,
                    amount: schedule.amount,
                  });
                }
              });
            }
          );

          // Simpan subscription untuk cleaning
          scheduleUnsub();
        });
      }
    );

    return () => unsub();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logout berhasil");
      router.push("/login");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const formatDate = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return "";

    try {
      const date =
        timestamp instanceof Timestamp
          ? timestamp.toDate()
          : new Date(timestamp);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const currentMenu =
    menus.find((menu) => menu.path === pathname)?.name || "Dashboard";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile Components - Hanya muncul di mobile */}
      <MobileHeader
        currentMenu={currentMenu}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />

      <MobileSidebarDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={pathname}
        handleLogout={handleLogout}
        userData={userData}
        loading={loading}
      />

      {/* DESKTOP SIDEBAR - Hanya muncul di desktop */}
      <aside className="hidden md:block sticky top-0 h-screen w-72 border-r border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Finora
              </h1>
              <p className="text-xs text-slate-500">Financial Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu Utama
            </p>
            {menus.slice(0, 5).map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  pathname === menu.path
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span
                  className={
                    pathname === menu.path ? "text-white" : "text-blue-500"
                  }
                >
                  {menu.icon}
                </span>
                {menu.name}
              </Link>
            ))}

            <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Analisis
            </p>
            {menus.slice(5, 7).map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  pathname === menu.path
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span
                  className={
                    pathname === menu.path ? "text-white" : "text-blue-500"
                  }
                >
                  {menu.icon}
                </span>
                {menu.name}
              </Link>
            ))}
          </nav>

          {/* Logout & Help */}
          <div className="mt-auto space-y-4 border-t border-blue-100 pt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>

            <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4">
              <p className="text-xs font-medium text-blue-700">
                Butuh bantuan?
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Hubungi support kami
              </p>
              <button className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                Kontak Support
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-0">
        {/* Desktop Header - Hanya muncul di desktop */}
        <header className="hidden md:block sticky top-0 z-10 border-b border-blue-100 bg-white/80 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {currentMenu}
              </h1>
              <p className="text-sm text-slate-600">
                {formatDate(userData?.createdAt || null)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {loading ? "Loading..." : userData?.name || "User Account"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {loading
                      ? "loading..."
                      : userData?.email || "user@email.com"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer">
                  <span className="text-white font-bold text-sm">
                    {loading ? "U" : getInitials(userData?.name || "U")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <AuthGuard>
        <div className="p-2 md:p-4">
          {/* Mobile: Menambahkan margin top untuk menghindari tumpang tindih dengan MobileHeader */}
          <div className="mt-16 md:mt-0 rounded-xl md:rounded-2xl bg-white/80 border border-blue-100 shadow-lg shadow-blue-500/5 backdrop-blur-sm">
            {children}
          </div>
        </div>
        </AuthGuard>
      </main>
    </div>
  );
}