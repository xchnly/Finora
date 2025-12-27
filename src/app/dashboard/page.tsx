"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import {
  collection,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  BarChart3,
  PieChart,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Landmark,
  Banknote,
  Target,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  MoreVertical,
  Home,
  ShoppingBag,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  CalendarDays,
  CheckCircle,
  Shield,
  HelpCircle,
  LineChart,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type StatusIconProps = {
  size?: number;
  className?: string;
};

function StatusIcon({ size = 14, className }: StatusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

type Wallet = {
  id: string;
  name: string;
  balance: number;
  color: string;
  type: "cash" | "bank" | "digital";
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  walletId: string;
  categoryId: string;
  date: Timestamp;
  note?: string;
};

type Budget = {
  id: string;
  categoryId: string;
  limit: number;
};

type Analytics = {
  dailySpending: Array<{ date: string; amount: number }>;
  categorySpending: Array<{ name: string; value: number; color: string }>;
  walletDistribution: Array<{ name: string; value: number; color: string }>;
  monthlyTrend: Array<{ month: string; income: number; expense: number }>;
};

export default function DashboardPage() {
  const user = auth.currentUser;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "insights"
  >("overview");

  // State untuk insights
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  );
  const [showAmounts, setShowAmounts] = useState(true);

  // 🔥 LOAD WALLETS
  useEffect(() => {
    if (!user) return;

    return onSnapshot(collection(db, "users", user.uid, "wallets"), (snap) => {
      setWallets(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Wallet, "id">),
        }))
      );
    });
  }, [user]);

  // 🔥 LOAD CATEGORIES
  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Category, "id">),
          }))
        );
      }
    );
  }, [user]);

  // 🔥 LOAD TRANSACTIONS dengan order
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "transactions");
    const q = query(ref, orderBy("date", "desc"));

    return onSnapshot(q, (snap) => {
      const data: Transaction[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Transaction, "id">),
      }));
      setTransactions(data);
      setLoading(false);
    });
  }, [user]);

  // 🔥 LOAD BUDGETS
  useEffect(() => {
    if (!user) return;

    return onSnapshot(collection(db, "users", user.uid, "budgets"), (snap) => {
      setBudgets(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Budget, "id">),
        }))
      );
    });
  }, [user]);

  // 📊 ANALYTICS DATA
  const analytics = useMemo((): Analytics => {
    const now = new Date();
    const dailySpending: Array<{ date: string; amount: number }> = [];
    const categorySpendingMap: Record<string, number> = {};
    const walletDistributionMap: Record<string, number> = {};
    const monthlyTrendMap: Record<string, { income: number; expense: number }> =
      {};

    // Filter berdasarkan timeRange
    const filteredTransactions = transactions.filter((tx) => {
      const txDate = tx.date.toDate();
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case "week":
          return diffDays <= 7;
        case "month":
          return diffDays <= 30;
        case "year":
          return diffDays <= 365;
        default:
          return true;
      }
    });

    // Daily spending (7 hari terakhir)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "2-digit",
      });

      const dayTotal = filteredTransactions
        .filter((tx) => {
          const txDate = tx.date.toDate();
          return (
            txDate.getDate() === date.getDate() &&
            txDate.getMonth() === date.getMonth() &&
            txDate.getFullYear() === date.getFullYear()
          );
        })
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      dailySpending.push({ date: dateStr, amount: dayTotal });
    }

    // Category spending
    filteredTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const category = categories.find((c) => c.id === tx.categoryId);
        if (category) {
          categorySpendingMap[category.name] =
            (categorySpendingMap[category.name] || 0) + tx.amount;
        }
      });

    const categorySpending = Object.entries(categorySpendingMap)
      .map(([name, value]) => {
        const category = categories.find((c) => c.name === name);
        return {
          name,
          value,
          color: category?.color || "#6b7280",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Wallet distribution
    wallets.forEach((wallet) => {
      const walletTotal = filteredTransactions
        .filter((tx) => tx.walletId === wallet.id)
        .reduce((sum, tx) => sum + tx.amount, 0);
      walletDistributionMap[wallet.name] = walletTotal;
    });

    const walletDistribution = wallets
      .map((wallet) => ({
        name: wallet.name,
        value: walletDistributionMap[wallet.name] || 0,
        color: wallet.color,
      }))
      .filter((w) => w.value > 0);

    // Monthly trend (6 bulan terakhir)
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString("id-ID", { month: "short" });

      const monthIncome = filteredTransactions
        .filter((tx) => {
          const txDate = tx.date.toDate();
          return (
            txDate.getMonth() === date.getMonth() &&
            txDate.getFullYear() === date.getFullYear() &&
            tx.type === "income"
          );
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthExpense = filteredTransactions
        .filter((tx) => {
          const txDate = tx.date.toDate();
          return (
            txDate.getMonth() === date.getMonth() &&
            txDate.getFullYear() === date.getFullYear() &&
            tx.type === "expense"
          );
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      monthlyTrendMap[monthStr] = {
        income: monthIncome,
        expense: monthExpense,
      };
    }

    const monthlyTrend = Object.entries(monthlyTrendMap).map(
      ([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
      })
    );

    return {
      dailySpending,
      categorySpending,
      walletDistribution,
      monthlyTrend,
    };
  }, [transactions, categories, wallets, timeRange]);

  // 📊 TOTAL SALDO
  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    [wallets]
  );

  // 📅 FILTER BULAN INI
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthlyTx = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = tx.date.toDate();
        return d.getMonth() === month && d.getFullYear() === year;
      }),
    [transactions, month, year]
  );

  // 💸 INCOME & EXPENSE
  const totalIncome = monthlyTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = monthlyTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const cashFlow = totalIncome - totalExpense;

  // ⚠️ BUDGET WARNING COUNT
  const budgetWarnings = useMemo(() => {
    const categorySpending: Record<string, number> = {};

    monthlyTx.forEach((t) => {
      if (t.type === "expense") {
        categorySpending[t.categoryId] =
          (categorySpending[t.categoryId] || 0) + t.amount;
      }
    });

    return budgets
      .map((budget) => {
        const used = categorySpending[budget.categoryId] || 0;
        const percentage = (used / budget.limit) * 100;
        const category = categories.find((c) => c.id === budget.categoryId);

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: category?.name || "Unknown",
          icon: category?.icon || "💰",
          color: category?.color || "#6b7280",
          limit: budget.limit,
          used,
          percentage: Math.min(100, percentage),
          status:
            percentage >= 90 ? "danger" : percentage >= 70 ? "warning" : "safe",
        };
      })
      .filter((b) => b.percentage >= 70)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, monthlyTx, categories]);

  // 📈 GROWTH RATE
  const growthRate = useMemo(() => {
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    const prevMonthTx = transactions.filter((tx) => {
      const d = tx.date.toDate();
      return (
        d.getMonth() === prevMonth.getMonth() &&
        d.getFullYear() === prevMonth.getFullYear()
      );
    });

    const prevMonthIncome = prevMonthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const prevMonthExpense = prevMonthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const incomeGrowth =
      prevMonthIncome === 0
        ? 0
        : ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100;
    const expenseGrowth =
      prevMonthExpense === 0
        ? 0
        : ((totalExpense - prevMonthExpense) / prevMonthExpense) * 100;

    return { incomeGrowth, expenseGrowth };
  }, [transactions, totalIncome, totalExpense]);

  // 🔄 EXPORT DATA
  const handleExportData = () => {
    const worksheetData = [
      {
        Metrik: "Total Balance",
        Nilai: `Rp ${totalBalance.toLocaleString("id-ID")}`,
      },
      {
        Metrik: "Total Income Bulan Ini",
        Nilai: `Rp ${totalIncome.toLocaleString("id-ID")}`,
      },
      {
        Metrik: "Total Expense Bulan Ini",
        Nilai: `Rp ${totalExpense.toLocaleString("id-ID")}`,
      },
      {
        Metrik: "Cash Flow",
        Nilai: `Rp ${cashFlow.toLocaleString("id-ID")}`,
      },
      {
        Metrik: "Jumlah Wallet",
        Nilai: wallets.length,
      },
      {
        Metrik: "Jumlah Budget Alert",
        Nilai: budgetWarnings.length,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Summary");

    XLSX.writeFile(
      workbook,
      `dashboard-summary-${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Data dashboard berhasil diekspor");
  };

  // 🔄 REFRESH DATA
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
    toast.success("Data diperbarui");
  };

  // FUNGSI UNTUK INSIGHTS
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const value = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      const label = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }

    return options;
  };

  // Health Score
  const healthScore = useMemo(() => {
    const expenseScore =
      totalIncome > 0
        ? Math.max(0, 100 - (totalExpense / totalIncome) * 100)
        : 100;
    const savingScore =
      totalIncome > 0 ? Math.min(100, (cashFlow / totalIncome) * 100 * 2) : 100;
    const budgetScore =
      budgetWarnings.length === 0
        ? 100
        : Math.max(0, 100 - budgetWarnings.length * 20);

    return Math.round((expenseScore + savingScore + budgetScore) / 3);
  }, [totalIncome, totalExpense, cashFlow, budgetWarnings.length]);

  // Financial Ratios
  const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;
  const debtRatio = 0; // Jika ada data hutang, ganti dengan perhitungan sebenarnya
  const savingRate = totalIncome > 0 ? cashFlow / totalIncome : 0;

  // Data untuk insights
  const income = totalIncome;
  const expense = totalExpense;
  const incomeChange = growthRate.incomeGrowth;
  const expenseChange = growthRate.expenseGrowth;

  // Expense Categories untuk insights
  const expenseCategories = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    monthlyTx
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const category = categories.find((c) => c.id === tx.categoryId);
        if (category) {
          categoryMap[category.name] =
            (categoryMap[category.name] || 0) + tx.amount;
        }
      });

    return Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTx, categories]);

  // Data hutang (dummy data)
  const totalDebtThisMonth = 0;
  const loanSchedules: Array<{
    id: string;
    loanName: string;
    amount: number;
    dueDate: Timestamp;
    month: string;
    paid: boolean;
    status: string;
  }> = [];

  // Health Status
  const healthStatus = useMemo(() => {
    if (healthScore >= 80) {
      return {
        label: "Excellent",
        color: "text-emerald-600",
        bg: "bg-emerald-100",
      };
    } else if (healthScore >= 60) {
      return {
        label: "Good",
        color: "text-blue-600",
        bg: "bg-blue-100",
      };
    } else if (healthScore >= 40) {
      return {
        label: "Fair",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    } else {
      return {
        label: "Poor",
        color: "text-red-600",
        bg: "bg-red-100",
      };
    }
  }, [healthScore]);

  // Fungsi untuk mendapatkan rekomendasi
  const getRecommendations = () => {
    const recommendations = [];

    if (expenseRatio > 0.7) {
      recommendations.push(
        "Pengeluaran Anda terlalu tinggi (>70%). Pertimbangkan untuk mengurangi pengeluaran non-esensial."
      );
    } else if (expenseRatio > 0.5) {
      recommendations.push(
        "Pengeluaran Anda cukup tinggi (50-70%). Coba optimalkan pengeluaran rutin."
      );
    }

    if (savingRate < 0.1) {
      recommendations.push(
        "Tingkat tabungan Anda rendah (<10%). Usahakan menabung minimal 20% dari pendapatan."
      );
    } else if (savingRate < 0.2) {
      recommendations.push(
        "Tingkat tabungan Anda sedang (10-20%). Targetkan untuk mencapai 20% atau lebih."
      );
    }

    if (budgetWarnings.length > 0) {
      recommendations.push(
        `Anda memiliki ${budgetWarnings.length} kategori yang hampir melebihi budget. Periksa pengeluaran tersebut.`
      );
    }

    if (cashFlow < 0) {
      recommendations.push(
        "Cash flow negatif. Anda menghabiskan lebih dari yang dihasilkan. Segera evaluasi keuangan."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Keuangan Anda dalam kondisi baik! Pertahankan kebiasaan finansial yang sehat."
      );
    }

    return recommendations;
  };

  // StatusIcon Component
  const StatusIcon = ({
    className,
    size = 14,
  }: {
    className?: string;
    size?: number;
  }) => {
    if (healthScore >= 80) {
      return <TrendingUp className={className} size={size} />;
    } else if (healthScore >= 60) {
      return <TrendingUp className={className} size={size} />;
    } else if (healthScore >= 40) {
      return <TrendingDown className={className} size={size} />;
    } else {
      return <AlertCircle className={className} size={size} />;
    }
  };

  // Get wallet icon
  const getWalletIcon = (type: string) => {
    switch (type) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "bank":
        return <Landmark className="h-4 w-4" />;
      case "digital":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  // Category icon mapping
  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, ReactNode> = {
      "🏠": <Home className="h-4 w-4" />,
      "🛒": <ShoppingBag className="h-4 w-4" />,
      "🚗": <Car className="h-4 w-4" />,
      "🍽️": <Utensils className="h-4 w-4" />,
      "❤️": <Heart className="h-4 w-4" />,
      "🎓": <GraduationCap className="h-4 w-4" />,
    };
    return iconMap[iconName] || <span className="text-sm">{iconName}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-slate-200 rounded-lg mt-2"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-4 sm:p-5 animate-pulse"
            >
              <div className="h-4 w-32 bg-slate-200 rounded mb-3"></div>
              <div className="h-8 w-40 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
            Ringkasan lengkap dan analisis keuangan Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showBalance ? (
              <EyeOff size={14} className="sm:w-4 sm:h-4" />
            ) : (
              <Eye size={14} className="sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">
              {showBalance ? "Sembunyikan" : "Tampilkan"}
            </span>
            <span className="sm:hidden">Saldo</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <RefreshCw size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* TIME RANGE SELECTOR */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Periode Analisis:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "border border-blue-200 text-slate-700 hover:bg-blue-50"
                }`}
              >
                {range === "week" && "7 Hari"}
                {range === "month" && "30 Hari"}
                {range === "year" && "1 Tahun"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Total Balance
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance
                  ? `Rp ${totalBalance.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm opacity-90">
            <Wallet size={12} className="sm:w-4 sm:h-4" />
            <span>{wallets.length} wallet aktif</span>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Income Bulan Ini
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance
                  ? `Rp ${totalIncome.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm opacity-90">
            {growthRate.incomeGrowth !== 0 && (
              <>
                {growthRate.incomeGrowth > 0 ? (
                  <ArrowUpRight size={12} className="sm:w-4 sm:h-4" />
                ) : (
                  <ArrowDownRight size={12} className="sm:w-4 sm:h-4" />
                )}
                <span>
                  {Math.abs(growthRate.incomeGrowth).toFixed(1)}% dari bulan
                  lalu
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Expense Bulan Ini
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance
                  ? `Rp ${totalExpense.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm opacity-90">
            {growthRate.expenseGrowth !== 0 && (
              <>
                {growthRate.expenseGrowth > 0 ? (
                  <ArrowUpRight
                    size={12}
                    className="sm:w-4 sm:h-4 text-yellow-300"
                  />
                ) : (
                  <ArrowDownRight
                    size={12}
                    className="sm:w-4 sm:h-4 text-emerald-300"
                  />
                )}
                <span>
                  {Math.abs(growthRate.expenseGrowth).toFixed(1)}% dari bulan
                  lalu
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Cash Flow
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance
                  ? `Rp ${cashFlow.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {cashFlow >= 0 ? "Surplus" : "Defisit"} •{" "}
            {(totalIncome > 0 ? (cashFlow / totalIncome) * 100 : 0).toFixed(1)}%
            dari income
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-1 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-1">
          {(["overview", "analytics", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-blue-50"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "analytics" && "Analytics"}
              {tab === "insights" && "Insights"}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT BASED ON ACTIVE TAB */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* WALLETS OVERVIEW */}
          <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                Wallet Overview
              </h3>
              <span className="text-xs sm:text-sm text-slate-600">
                {wallets.length} wallet
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: wallet.color }}
                      />
                      <span className="text-sm sm:text-base font-medium text-slate-800">
                        {wallet.name}
                      </span>
                    </div>
                    {getWalletIcon(wallet.type)}
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-slate-800">
                    {showBalance
                      ? `Rp ${wallet.balance.toLocaleString("id-ID")}`
                      : "******"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {wallet.type === "cash" && "Uang Tunai"}
                    {wallet.type === "bank" && "Rekening Bank"}
                    {wallet.type === "digital" && "Dompet Digital"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* BUDGET ALERTS & RECENT TRANSACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* BUDGET ALERTS */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Budget Alerts
                </h3>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs sm:text-sm text-slate-600">
                    {budgetWarnings.length} alert
                  </span>
                </div>
              </div>

              {budgetWarnings.length === 0 ? (
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-4 sm:p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-800">
                    Semua budget masih aman
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Tidak ada kategori yang hampir melebihi budget
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {budgetWarnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="rounded-lg border border-red-100 bg-red-50/50 p-3 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ color: warning.color }}>
                            {getCategoryIcon(warning.icon)}
                          </span>
                          <span className="text-sm font-medium text-slate-800">
                            {warning.categoryName}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            warning.status === "danger"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {warning.status === "danger"
                            ? "Melebihi"
                            : "Perhatian"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>
                            Terpakai: Rp {warning.used.toLocaleString("id-ID")}
                          </span>
                          <span>
                            Limit: Rp {warning.limit.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-red-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              warning.status === "danger"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                            style={{ width: `${warning.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-red-600 font-medium">
                          {warning.percentage.toFixed(1)}% terpakai • Sisa: Rp{" "}
                          {Math.max(
                            0,
                            warning.limit - warning.used
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Recent Transactions
                </h3>
                <span className="text-xs sm:text-sm text-slate-600">
                  {monthlyTx.length} transaksi bulan ini
                </span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {monthlyTx.slice(0, 10).map((tx) => {
                  const category = categories.find(
                    (c) => c.id === tx.categoryId
                  );
                  const wallet = wallets.find((w) => w.id === tx.walletId);

                  return (
                    <div
                      key={tx.id}
                      className="rounded-lg border border-blue-50 p-3 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                              tx.type === "income"
                                ? "bg-emerald-100"
                                : "bg-red-100"
                            }`}
                          >
                            <span
                              style={{ color: category?.color || "#6b7280" }}
                            >
                              {getCategoryIcon(category?.icon || "💰")}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-medium text-slate-800">
                              {category?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {tx.date.toDate().toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                              })}
                              {" • "}
                              {wallet?.name || "-"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm sm:text-base font-semibold ${
                              tx.type === "income"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {tx.type === "expense" && "-"}Rp{" "}
                            {tx.amount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.note
                              ? tx.note.slice(0, 20) +
                                (tx.note.length > 20 ? "..." : "")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {monthlyTx.length === 0 && (
                  <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      Belum ada transaksi bulan ini
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Mulai tambahkan transaksi untuk melihat riwayat
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4 sm:space-y-6">
          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* DAILY SPENDING CHART */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-800">
                Daily Spending
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={analytics.dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) =>
                        `Rp ${value.toLocaleString("id-ID")}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`,
                        "Amount",
                      ]}
                      labelFormatter={(label) => `Hari: ${label}`}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CATEGORY SPENDING PIE CHART */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-800">
                Category Spending
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent !== undefined
                          ? `${name}: ${(percent * 100).toFixed(0)}%`
                          : name
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`,
                        "Amount",
                      ]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MONTHLY TREND LINE CHART */}
            <div className="lg:col-span-2 rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-800">
                Monthly Trend
              </h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={analytics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) =>
                        `Rp ${value.toLocaleString("id-ID")}`
                      }
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`,
                        name === "income" ? "Income" : "Expense",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-4 sm:space-y-6">
          {/* INSIGHTS HEADER */}
          <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Pilih Bulan
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="w-full rounded-lg border border-blue-200 bg-white py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {getMonthOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => setShowAmounts(!showAmounts)}
                  className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {showAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="hidden sm:inline">Saldo</span>
                </button>
              </div>
            </div>
          </div>

          {/* HEALTH OVERVIEW CARD */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-sm sm:text-base font-semibold text-slate-700">
                  Financial Health Overview
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-8 border-slate-100">
                      <div
                        className="absolute inset-2 rounded-full"
                        style={{
                          background: `conic-gradient(#10b981 ${
                            healthScore * 3.6
                          }deg, #e2e8f0 0deg)`,
                        }}
                      />
                      <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-800">
                          {Math.round(healthScore)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${healthStatus.bg}`}
                    >
                      <span
                        className={`text-xs sm:text-sm font-medium ${healthStatus.color}`}
                      >
                        {healthStatus.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Skor berdasarkan analisis keuangan {selectedMonth}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-[180px]">
                <div className="rounded-lg bg-white border border-emerald-100 p-3 text-center">
                  <p className="text-xs text-slate-500">Income</p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-slate-800">
                    {showAmounts
                      ? `Rp ${income.toLocaleString("id-ID")}`
                      : "******"}
                  </p>
                  {incomeChange !== 0 && (
                    <p
                      className={`mt-1 text-xs ${
                        incomeChange > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {incomeChange > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(incomeChange).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-white border border-red-100 p-3 text-center">
                  <p className="text-xs text-slate-500">Expense</p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-slate-800">
                    {showAmounts
                      ? `Rp ${expense.toLocaleString("id-ID")}`
                      : "******"}
                  </p>
                  {expenseChange !== 0 && (
                    <p
                      className={`mt-1 text-xs ${
                        expenseChange < 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {expenseChange < 0 ? "↓" : "↑"}{" "}
                      {Math.abs(expenseChange).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INSIGHTS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* SPENDING HABIT */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Spending Habit
                </h3>
              </div>
              <div className="space-y-3">
                {expenseCategories.slice(0, 3).map((category, index) => {
                  const percentage =
                    expense > 0 ? (category.amount / expense) * 100 : 0;
                  const colors = [
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ef4444",
                  ];

                  return (
                    <div
                      key={category.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        />
                        <span className="text-sm text-slate-700">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">
                          {showAmounts
                            ? `Rp ${category.amount.toLocaleString("id-ID")}`
                            : "******"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {percentage.toFixed(1)}% dari total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-slate-600">
                Top 3 kategori pengeluaran terbesar Anda di {selectedMonth}
              </p>
            </div>

            {/* SAVINGS RATE */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Savings Rate
                </h3>
              </div>
              <div className="text-center py-4">
                <div className="inline-flex flex-col items-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full border-8 border-slate-200">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-emerald-500"
                        style={{
                          clipPath: `inset(0 ${
                            100 - Math.min(100, savingRate * 100)
                          }% 0 0)`,
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-800">
                        {Math.round(savingRate * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-700">
                    {cashFlow >= 0 ? "Tabungan" : "Defisit"} dari income
                  </p>
                  <p className="text-xs text-slate-500">
                    {showAmounts
                      ? `Rp ${Math.abs(cashFlow).toLocaleString("id-ID")}`
                      : "******"}
                  </p>
                  <div className="mt-2 text-xs text-slate-500">
                    Ideal: ≥ 20%
                  </div>
                </div>
              </div>
            </div>

            {/* FINANCIAL HEALTH METRICS */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Financial Health
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Expense Ratio</span>
                  <span
                    className={`text-sm font-medium ${
                      expenseRatio <= 0.5
                        ? "text-emerald-600"
                        : expenseRatio <= 0.7
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(expenseRatio * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Debt-to-Income</span>
                  <span
                    className={`text-sm font-medium ${
                      debtRatio <= 0.3
                        ? "text-emerald-600"
                        : debtRatio <= 0.4
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(debtRatio * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Cash Flow</span>
                  <span
                    className={`text-sm font-medium ${
                      cashFlow > 0
                        ? "text-emerald-600"
                        : cashFlow === 0
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {showAmounts
                      ? `Rp ${cashFlow.toLocaleString("id-ID")}`
                      : "******"}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-600">
                Expense Ratio ideal ≤ 50%, Debt Ratio ideal ≤ 30%
              </p>
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-blue-800">
                💡 Recommendations
              </h3>
            </div>

            <div className="space-y-3">
              {getRecommendations().map((recommendation, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg border border-blue-100 bg-white/50 hover:bg-white transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {healthScore >= 80 ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* TREND ANALYSIS */}
            <div className="mt-6 pt-4 border-t border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <LineChart className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">
                  Trend Analysis
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-2 sm:p-3 rounded-lg bg-white/80 border border-blue-100">
                  <p className="text-xs text-slate-500">Income Trend</p>
                  <p
                    className={`text-sm font-medium ${
                      incomeChange > 0
                        ? "text-emerald-600"
                        : incomeChange < 0
                        ? "text-red-600"
                        : "text-slate-600"
                    }`}
                  >
                    {incomeChange > 0 ? "+" : ""}
                    {incomeChange.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-2 sm:p-3 rounded-lg bg-white/80 border border-blue-100">
                  <p className="text-xs text-slate-500">Expense Trend</p>
                  <p
                    className={`text-sm font-medium ${
                      expenseChange < 0
                        ? "text-emerald-600"
                        : expenseChange > 0
                        ? "text-red-600"
                        : "text-slate-600"
                    }`}
                  >
                    {expenseChange > 0 ? "+" : ""}
                    {expenseChange.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-2 sm:p-3 rounded-lg bg-white/80 border border-blue-100">
                  <p className="text-xs text-slate-500">Saving Rate</p>
                  <p
                    className={`text-sm font-medium ${
                      savingRate >= 0.2
                        ? "text-emerald-600"
                        : savingRate >= 0.1
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(savingRate * 100)}%
                  </p>
                </div>

                <div className="text-center p-2 sm:p-3 rounded-lg bg-white/80 border border-blue-100">
                  <p className="text-xs text-slate-500">Health Score</p>
                  <p
                    className={`text-sm font-medium ${
                      healthScore >= 80
                        ? "text-emerald-600"
                        : healthScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(healthScore)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* UPCOMING DEBTS */}
          <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                  Upcoming Debts
                </h3>
              </div>
              <span className="text-xs text-slate-500">{selectedMonth}</span>
            </div>

            {totalDebtThisMonth > 0 ? (
              <div className="space-y-3">
                {loanSchedules
                  .filter((s) => s.month === selectedMonth && !s.paid)
                  .slice(0, 3)
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-blue-50 hover:bg-blue-50/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {schedule.loanName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due:{" "}
                          {schedule.dueDate
                            .toDate()
                            .toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {showAmounts
                            ? `Rp ${schedule.amount.toLocaleString("id-ID")}`
                            : "******"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {schedule.status === "overdue"
                            ? "Overdue"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  ))}

                {loanSchedules.filter(
                  (s) => s.month === selectedMonth && !s.paid
                ).length > 3 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 text-center">
                      +
                      {loanSchedules.filter(
                        (s) => s.month === selectedMonth && !s.paid
                      ).length - 3}{" "}
                      cicilan lainnya
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Tidak ada cicilan bulan ini
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-700">
                  Total Cicilan Bulan Ini:
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {showAmounts
                    ? `Rp ${totalDebtThisMonth.toLocaleString("id-ID")}`
                    : "******"}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Debt Ratio: {Math.round(debtRatio * 100)}% dari income
              </p>
            </div>
          </div>

          {/* FINANCIAL TIPS */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-semibold text-blue-800">
                Financial Health Tips
              </h4>
            </div>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-700">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  Jaga expense ratio di bawah 50% untuk kesehatan keuangan yang
                  optimal.
                </span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  Targetkan saving rate minimal 20% dari total pendapatan.
                </span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  Hindari debt ratio di atas 30% dari pendapatan bulanan.
                </span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  Review pengeluaran rutin dan identifikasi area yang bisa
                  dioptimalkan.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* QUICK STATS FOOTER */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">Avg Daily Spend</p>
            <p className="text-sm sm:text-base font-semibold text-slate-800">
              Rp {Math.round(totalExpense / 30).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Transactions/Month
            </p>
            <p className="text-sm sm:text-base font-semibold text-slate-800">
              {monthlyTx.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">Active Budgets</p>
            <p className="text-sm sm:text-base font-semibold text-slate-800">
              {budgets.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">Wallet Types</p>
            <p className="text-sm sm:text-base font-semibold text-slate-800">
              {new Set(wallets.map((w) => w.type)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
