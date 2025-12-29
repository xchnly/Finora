"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar,
  Target,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Shield,
  LineChart,
  Clock,
  CalendarDays,
  FileText,
  HelpCircle,
} from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: Timestamp;
  category: string;
  description?: string;
  createdAt: Timestamp;
};

type LoanSchedule = {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  principal: number;
  interest: number;
  paid: boolean;
  dueDate: Timestamp;
  status: "pending" | "paid" | "overdue";
  loanId: string;
  loanName: string;
};

export default function HealthPage() {
  const user = auth.currentUser;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanSchedules, setLoanSchedules] = useState<LoanSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");

  /* ======================
     LOAD TRANSACTIONS
  ====================== */
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "transactions");
    const q = query(ref, orderBy("date", "desc"));
    
    return onSnapshot(q, (snap) => {
      const data: Transaction[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type || "expense",
          amount: data.amount || 0,
          date: data.date || Timestamp.now(),
          category: data.category || "other",
          description: data.description,
          createdAt: data.createdAt || Timestamp.now(),
        };
      });
      setTransactions(data);
    });
  }, [user]);

  /* ======================
     LOAD LOAN SCHEDULES
  ====================== */
  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    const loansRef = collection(db, "users", user.uid, "loans");

    const unsubscribeLoans = onSnapshot(loansRef, (loanSnap) => {
      loanSnap.docs.forEach((loanDoc) => {
        const loanData = loanDoc.data();
        const unsub = onSnapshot(
          collection(
            db,
            "users",
            user.uid,
            "loans",
            loanDoc.id,
            "schedules"
          ),
          (scheduleSnap) => {
            const newSchedules = scheduleSnap.docs.map((d) => {
              const data = d.data();
              return {
                id: `${loanDoc.id}_${d.id}`,
                month: data.month || "",
                amount: data.amount || 0,
                principal: data.principal || 0,
                interest: data.interest || 0,
                paid: data.paid || false,
                dueDate: data.dueDate || Timestamp.now(),
                status: data.status || "pending",
                loanId: loanDoc.id,
                loanName: loanData.name || "Untitled Loan",
              };
            });

            setLoanSchedules((prev) => {
              const others = prev.filter(
                (s) => !s.id.startsWith(loanDoc.id)
              );
              return [...others, ...newSchedules];
            });
          }
        );

        unsubscribers.push(unsub);
      });
    });

    unsubscribers.push(unsubscribeLoans);

    return () => {
      unsubscribers.forEach((u) => u());
      setLoading(false);
    };
  }, [user]);

  /* ======================
     FILTER DATA BERDASARKAN TIME RANGE
  ====================== */
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions.filter((tx) => {
      const txDate = tx.date.toDate();
      return txDate >= startDate && txDate <= now;
    });
  }, [transactions, timeRange]);

  /* ======================
     DATA BULAN INI
  ====================== */
  const currentMonthData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return transactions.filter((tx) => {
      const txDate = tx.date.toDate();
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() + 1 === month
      );
    });
  }, [transactions, selectedMonth]);

  /* ======================
     KATEGORI PENGELUARAN
  ====================== */
  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    
    currentMonthData
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthData]);

  const topExpenseCategories = expenseCategories.slice(0, 5);

  /* ======================
     INCOME & EXPENSE
  ====================== */
  const income = currentMonthData
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = currentMonthData
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const cashFlow = income - expense;

  /* ======================
     CICILAN BULAN INI
  ====================== */
  const totalDebtThisMonth = loanSchedules
    .filter(
      (s) => s.month === selectedMonth && !s.paid
    )
    .reduce((s, l) => s + l.amount, 0);

  const debtRatio = income > 0 ? totalDebtThisMonth / income : 0;
  const expenseRatio = income > 0 ? expense / income : 0;
  const savingRate = income > 0 ? (income - expense) / income : 0;

  /* ======================
     TREND ANALYSIS
  ====================== */
  const getPreviousMonth = (date: string): string => {
    const [year, month] = date.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const previousMonth = getPreviousMonth(selectedMonth);
  
  const previousMonthData = useMemo(() => {
    const [year, month] = previousMonth.split("-").map(Number);
    return transactions.filter((tx) => {
      const txDate = tx.date.toDate();
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() + 1 === month
      );
    });
  }, [transactions, previousMonth]);

  const previousIncome = previousMonthData
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const previousExpense = previousMonthData
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const incomeChange = previousIncome > 0 
    ? ((income - previousIncome) / previousIncome) * 100 
    : income > 0 ? 100 : 0;

  const expenseChange = previousExpense > 0 
    ? ((expense - previousExpense) / previousExpense) * 100 
    : expense > 0 ? 100 : 0;

  /* ======================
     HEALTH SCORE DENGAN WEIGHTED FACTORS
  ====================== */
  const healthScore = useMemo(() => {
    let score = 0;
    const maxScore = 100;

    // 1. Expense Ratio (30 points max)
    if (expenseRatio <= 0.5) score += 30;
    else if (expenseRatio <= 0.6) score += 25;
    else if (expenseRatio <= 0.7) score += 15;
    else if (expenseRatio <= 0.8) score += 5;
    else score += 0;

    // 2. Saving Rate (25 points max)
    if (savingRate >= 0.2) score += 25;
    else if (savingRate >= 0.15) score += 20;
    else if (savingRate >= 0.1) score += 15;
    else if (savingRate >= 0.05) score += 10;
    else if (savingRate > 0) score += 5;
    else score += 0;

    // 3. Debt Ratio (30 points max)
    if (debtRatio <= 0.2) score += 30;
    else if (debtRatio <= 0.3) score += 25;
    else if (debtRatio <= 0.4) score += 15;
    else if (debtRatio <= 0.5) score += 5;
    else score += 0;

    // 4. Cash Flow Positive (15 points max)
    if (cashFlow > income * 0.1) score += 15;
    else if (cashFlow > 0) score += 10;
    else if (cashFlow === 0) score += 5;
    else score += 0;

    // Ensure score doesn't exceed max
    return Math.min(score, maxScore);
  }, [expenseRatio, savingRate, debtRatio, cashFlow, income]);

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle };
    if (score >= 65) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100", icon: TrendingUp };
    if (score >= 50) return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertCircle };
    return { label: "Need Improvement", color: "text-red-600", bg: "bg-red-100", icon: TrendingDown };
  };

  const healthStatus = getHealthStatus(healthScore);
  const StatusIcon = healthStatus.icon;

  /* ======================
     FINANCIAL RECOMMENDATIONS
  ====================== */
  const getRecommendations = () => {
    const recommendations: string[] = [];

    if (expenseRatio > 0.7) {
      recommendations.push("Pengeluaran terlalu tinggi. Coba kurangi pengeluaran non-esensial.");
    }

    if (debtRatio > 0.4) {
      recommendations.push("Beban cicilan terlalu besar. Pertimbangkan restrukturisasi utang.");
    }

    if (savingRate < 0.1) {
      recommendations.push("Tingkat tabungan rendah. Alokasikan minimal 10% dari pendapatan untuk tabungan.");
    }

    if (cashFlow < 0) {
      recommendations.push("Cash flow negatif. Segera evaluasi pengeluaran dan cari sumber pendapatan tambahan.");
    }

    if (expenseCategories.length > 0 && expenseCategories[0].amount > expense * 0.5) {
      recommendations.push(`Kategori "${expenseCategories[0].name}" mendominasi pengeluaran. Evaluasi pengeluaran ini.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Kondisi keuangan Anda sehat. Pertahankan kebiasaan finansial yang baik!");
    }

    return recommendations.slice(0, 3); // Max 3 recommendations
  };

  /* ======================
     EXPORT TO EXCEL
  ====================== */
  const handleExportExcel = () => {
    try {
      const worksheetData = [
        {
          'Bulan': selectedMonth,
          'Pendapatan': income,
          'Pengeluaran': expense,
          'Cash Flow': cashFlow,
          'Rasio Pengeluaran': `${(expenseRatio * 100).toFixed(1)}%`,
          'Rasio Tabungan': `${(savingRate * 100).toFixed(1)}%`,
          'Rasio Cicilan': `${(debtRatio * 100).toFixed(1)}%`,
          'Skor Kesehatan': healthScore,
          'Status': healthStatus.label,
          'Cicilan Bulan Ini': totalDebtThisMonth,
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Health");
      
      XLSX.writeFile(workbook, `financial-health-${selectedMonth}.xlsx`);
      toast.success("Data kesehatan keuangan berhasil diekspor");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Gagal mengekspor data");
    }
  };

  /* ======================
     REFRESH DATA
  ====================== */
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Data diperbarui");
    }, 1000);
  };

  /* ======================
     MONTH SELECTOR OPTIONS
  ====================== */
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
            Financial Health
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
            Evaluasi dan pantau kesehatan keuangan Anda secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showAmounts ? <EyeOff size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{showAmounts ? "Sembunyikan" : "Tampilkan"}</span>
            <span className="sm:hidden">Saldo</span>
          </button>
          <button
            onClick={handleExportExcel}
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

      {/* FILTERS */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Pilih Bulan</label>
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

          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Rentang Waktu Analisis</label>
            <div className="flex gap-2">
              {(["month", "quarter", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors ${
                    timeRange === range
                      ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                      : "border-blue-200 hover:bg-blue-50 text-slate-700"
                  }`}
                >
                  {range === "month" && "Bulanan"}
                  {range === "quarter" && "3 Bulan"}
                  {range === "year" && "Tahunan"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HEALTH SCORE CARD */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center lg:text-left">
            <h2 className="text-sm sm:text-base font-semibold text-slate-700">Skor Kesehatan Keuangan</h2>
            <div className="mt-2 sm:mt-3 flex items-center justify-center lg:justify-start gap-3">
              <div className="relative">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-8 border-slate-100">
                  <div
                    className="absolute inset-2 rounded-full"
                    style={{
                      background: `conic-gradient(#10b981 ${healthScore * 3.6}deg, #e2e8f0 0deg)`,
                    }}
                  />
                  <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-800">{Math.round(healthScore)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${healthStatus.bg}`}>
                  <StatusIcon size={14} className={healthStatus.color} />
                  <span className={`text-xs sm:text-sm font-medium ${healthStatus.color}`}>
                    {healthStatus.label}
                  </span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xs">
                  Skor berdasarkan rasio pengeluaran, tabungan, cicilan, dan cash flow
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-[200px]">
            <div className="rounded-lg bg-white border border-emerald-100 p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500">Pendapatan</p>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-800">
                {showAmounts ? `Rp ${income.toLocaleString("id-ID")}` : "******"}
              </p>
              {previousIncome > 0 && (
                <p className={`mt-1 text-xs ${incomeChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}%
                </p>
              )}
            </div>

            <div className="rounded-lg bg-white border border-red-100 p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-xs text-slate-500">Pengeluaran</p>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-800">
                {showAmounts ? `Rp ${expense.toLocaleString("id-ID")}` : "******"}
              </p>
              {previousExpense > 0 && (
                <p className={`mt-1 text-xs ${expenseChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Expense Ratio"
          value={`${Math.round(expenseRatio * 100)}%`}
          description="Rasio pengeluaran vs pendapatan"
          ideal="≤ 50%"
          icon={PieChart}
          status={expenseRatio <= 0.5 ? "good" : expenseRatio <= 0.7 ? "warning" : "danger"}
          showAmounts={showAmounts}
        />
        
        <MetricCard
          title="Saving Rate"
          value={`${Math.round(savingRate * 100)}%`}
          description="Rasio tabungan vs pendapatan"
          ideal="≥ 20%"
          icon={PiggyBank}
          status={savingRate >= 0.2 ? "good" : savingRate >= 0.1 ? "warning" : "danger"}
          showAmounts={showAmounts}
        />
        
        <MetricCard
          title="Debt Ratio"
          value={`${Math.round(debtRatio * 100)}%`}
          description="Rasio cicilan vs pendapatan"
          ideal="≤ 30%"
          icon={CreditCard}
          status={debtRatio <= 0.3 ? "good" : debtRatio <= 0.4 ? "warning" : "danger"}
          showAmounts={showAmounts}
          amount={totalDebtThisMonth}
        />
        
        <MetricCard
          title="Cash Flow"
          value={`Rp ${cashFlow.toLocaleString("id-ID")}`}
          description="Pendapatan - Pengeluaran"
          ideal="> 0"
          icon={DollarSign}
          status={cashFlow > 0 ? "good" : cashFlow === 0 ? "warning" : "danger"}
          showAmounts={showAmounts}
        />
      </div>

      {/* DETAILED ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* EXPENSE BREAKDOWN */}
        <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 size={16} />
              Breakdown Pengeluaran
            </h3>
            <span className="text-xs text-slate-500">{selectedMonth}</span>
          </div>
          
          {topExpenseCategories.length > 0 ? (
            <div className="space-y-3">
              {topExpenseCategories.map((category, index) => {
                const percentage = expense > 0 ? (category.amount / expense) * 100 : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{category.name}</span>
                      <span className="text-slate-600">
                        {showAmounts ? `Rp ${category.amount.toLocaleString("id-ID")}` : "******"}
                        <span className="text-slate-500 ml-1">({percentage.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              {expenseCategories.length > 5 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    +{expenseCategories.length - 5} kategori lainnya
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <PieChart className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Belum ada data pengeluaran bulan ini</p>
            </div>
          )}
        </div>

        {/* UPCOMING DEBTS */}
        <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={16} />
              Cicilan Mendatang
            </h3>
            <span className="text-xs text-slate-500">{selectedMonth}</span>
          </div>
          
          {totalDebtThisMonth > 0 ? (
            <div className="space-y-3">
              {loanSchedules
                .filter((s) => s.month === selectedMonth && !s.paid)
                .slice(0, 5)
                .map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-blue-50 hover:bg-blue-50/50 transition-colors">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800">{schedule.loanName}</p>
                      <p className="text-xs text-slate-500">
                        Jatuh tempo: {schedule.dueDate.toDate().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        {showAmounts ? `Rp ${schedule.amount.toLocaleString("id-ID")}` : "******"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pokok: {showAmounts ? `Rp ${schedule.principal.toLocaleString("id-ID")}` : "******"}
                      </p>
                    </div>
                  </div>
                ))}
              
              {loanSchedules.filter((s) => s.month === selectedMonth && !s.paid).length > 5 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    +{loanSchedules.filter((s) => s.month === selectedMonth && !s.paid).length - 5} cicilan lainnya
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500">Tidak ada cicilan bulan ini</p>
            </div>
          )}
        </div>
      </div>

      {/* RECOMMENDATIONS & INSIGHTS */}
      <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm sm:text-base font-semibold text-slate-800">Rekomendasi & Insight</h3>
        </div>
        
        <div className="space-y-3">
          {getRecommendations().map((recommendation, index) => (
            <div key={index} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                {healthScore >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-700">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs sm:text-sm font-medium text-slate-700">Analisis Trend</h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500">Perubahan Pendapatan</p>
              <p className={`text-sm font-medium ${incomeChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500">Perubahan Pengeluaran</p>
              <p className={`text-sm font-medium ${expenseChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {expenseChange <= 0 ? '-' : '+'}{Math.abs(expenseChange).toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500">Sisa Cicilan</p>
              <p className="text-sm font-medium text-slate-800">
                {loanSchedules.filter((s) => !s.paid).length}
              </p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500">Transaksi Bulan Ini</p>
              <p className="text-sm font-medium text-slate-800">
                {currentMonthData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL TIPS */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <h4 className="text-xs sm:text-sm font-semibold text-blue-800">Tips Kesehatan Keuangan</h4>
        </div>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-700">
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Selalu alokasikan minimal 20% pendapatan untuk tabungan dan investasi.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Jaga rasio cicilan di bawah 30% dari total pendapatan.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Pantau pengeluaran rutin dan buat anggaran bulanan.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Siapkan dana darurat setara 3-6 bulan pengeluaran.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  ideal: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  status: "good" | "warning" | "danger";
  showAmounts: boolean;
  amount?: number;
};

function MetricCard({ 
  title, 
  value, 
  description, 
  ideal, 
  icon: Icon, 
  status, 
  showAmounts,
  amount 
}: MetricCardProps) {
  const statusColors = {
    good: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    warning: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    danger: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  };

  const colors = statusColors[status];

  return (
    <div className={`rounded-xl border ${colors.border} bg-white p-4 sm:p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 sm:p-2 rounded-lg ${colors.bg}`}>
            <Icon size={14} className={`sm:w-4 sm:h-4 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
          {ideal}
        </div>
      </div>
      
      <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {showAmounts ? value : "******"}
      </p>
      
      {amount !== undefined && (
        <p className="text-xs text-slate-500">
          {showAmounts ? `Rp ${amount.toLocaleString("id-ID")}` : "******"}
        </p>
      )}
      
      <div className="mt-2 sm:mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div 
            className={`h-full ${colors.bg.split(' ')[0]}`}
            style={{ 
              width: status === 'good' ? '90%' : status === 'warning' ? '60%' : '30%' 
            }}
          />
        </div>
        <span className={`text-xs font-medium ${colors.text}`}>
          {status === 'good' ? 'Baik' : status === 'warning' ? 'Waspada' : 'Perlu Perbaikan'}
        </span>
      </div>
    </div>
  );
}