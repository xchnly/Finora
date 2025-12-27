"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Plus,
  Trash2,
  Edit2,
  Filter,
  Search,
  TrendingDown,
  AlertCircle,
  Target,
  BarChart3,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Wallet,
  DollarSign,
  PieChart,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  transactionCount: number;
};

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  type: "income" | "expense";
  date: Timestamp;
};

type Budget = {
  id: string;
  categoryId: string;
  limit: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export default function BudgetsPage() {
  const user = auth.currentUser;

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [formattedLimit, setFormattedLimit] = useState("");
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7) // Format YYYY-MM
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔥 LOAD EXPENSE CATEGORIES
  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        const categoriesData = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Category, "id">),
          }))
          .filter((c) => c.type === "expense");
        
        setCategories(categoriesData);
      }
    );
  }, [user]);

  // 🔥 LOAD TRANSACTIONS
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
    });
  }, [user]);

  // 🔥 LOAD BUDGETS
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "budgets");
    const q = query(ref, orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snap) => {
      const data: Budget[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Budget, "id">),
      }));
      setBudgets(data);
      setLoading(false);
    });
  }, [user]);

  // Format currency input
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue) {
      const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
      setFormattedLimit(formatted);
      setLimit(numericValue);
    } else {
      setFormattedLimit("");
      setLimit("");
    }
  };

  // Parse formatted amount back to number
  const parseFormattedAmount = (formatted: string) => {
    return parseInt(formatted.replace(/\./g, '')) || 0;
  };

  // 🔢 HITUNG PEMAKAIAN BUDGET BULAN INI
  const usageMap = useMemo(() => {
    const [year, month] = monthFilter.split("-").map(Number);
    const map: Record<string, number> = {};

    transactions.forEach((tx) => {
      const d = tx.date.toDate();
      if (
        tx.type === "expense" &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      ) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      }
    });

    return map;
  }, [transactions, monthFilter]);

  const getBudgetStatus = useCallback(
  (budget: Budget) => {
    const used = usageMap[budget.categoryId] || 0;
    const percent = Math.min(
      100,
      Math.round((used / budget.limit) * 100)
    );

    if (percent === 0) return "unused";
    if (percent < 70) return "safe";
    if (percent < 90) return "warning";
    return "danger";
  },
  [usageMap]
);


  // Filter budgets
  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    // Filter by search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        return category?.name.toLowerCase().includes(query);
      });
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((budget) => {
        return getBudgetStatus(budget) === filterStatus;
      });
    }

    return filtered;
  }, [budgets, categories, searchQuery, filterStatus, getBudgetStatus]);

  // Calculate totals
  const { totalLimit, totalUsed, totalRemaining } = useMemo(() => {
    const limit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
    const used = budgets.reduce(
      (sum, budget) => sum + (usageMap[budget.categoryId] || 0),
      0
    );
    
    return {
      totalLimit: limit,
      totalUsed: used,
      totalRemaining: limit - used,
    };
  }, [budgets, usageMap]);

  // Count budgets by status
  const statusCounts = useMemo(() => {
    const counts = {
      unused: 0,
      safe: 0,
      warning: 0,
      danger: 0,
    };

    budgets.forEach((budget) => {
      counts[getBudgetStatus(budget) as keyof typeof counts]++;
    });

    return counts;
  }, [budgets, getBudgetStatus]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBudgets = filteredBudgets.slice(indexOfFirstItem, indexOfLastItem);

  // ➕ CREATE BUDGET
  const handleAdd = async () => {
    if (!categoryId || !limit) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    if (budgets.find((b) => b.categoryId === categoryId)) {
      toast.error("Budget untuk kategori ini sudah ada");
      return;
    }

    try {
      await addDoc(collection(db, "users", user!.uid, "budgets"), {
        categoryId,
        limit: parseFormattedAmount(formattedLimit) || Number(limit),
        createdAt: serverTimestamp(),
      });

      toast.success("Budget berhasil ditambahkan");
      resetForm();
      setOpenForm(false);
    } catch {
      toast.error("Gagal menambahkan budget");
    }
  };

  // ✏️ UPDATE BUDGET
  const handleEdit = async () => {
    if (!editingBudget || !categoryId || !limit) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      await updateDoc(
        doc(db, "users", user!.uid, "budgets", editingBudget.id),
        {
          categoryId,
          limit: parseFormattedAmount(formattedLimit) || Number(limit),
          updatedAt: serverTimestamp(),
        }
      );

      toast.success("Budget berhasil diperbarui");
      resetForm();
      setEditingBudget(null);
      setOpenForm(false);
    } catch {
      toast.error("Gagal memperbarui budget");
    }
  };

  // ❌ DELETE BUDGET
  const handleDelete = async (budget: Budget) => {
    try {
      await deleteDoc(doc(db, "users", user!.uid, "budgets", budget.id));
      toast.success("Budget berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus budget");
    }
  };

  // Setup form for editing
  const setupEditForm = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setLimit(budget.limit.toString());
    setFormattedLimit(budget.limit.toLocaleString('id-ID'));
    setOpenForm(true);
  };

  // Reset form
  const resetForm = () => {
    setCategoryId("");
    setLimit("");
    setFormattedLimit("");
    setEditingBudget(null);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "unused": return "bg-slate-500";
      case "safe": return "bg-emerald-500";
      case "warning": return "bg-yellow-500";
      case "danger": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "unused": return "Belum Digunakan";
      case "safe": return "Aman";
      case "warning": return "Perhatian";
      case "danger": return "Melebihi";
      default: return "";
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
            Budgets
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
            Atur dan pantau batas pengeluaran per kategori.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Budget</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Total Budget</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                Rp {totalLimit.toLocaleString("id-ID")}
              </p>
            </div>
            <Target className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {budgets.length} kategori
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Terpakai</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                Rp {totalUsed.toLocaleString("id-ID")}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {((totalUsed / totalLimit) * 100 || 0).toFixed(1)}% dari total
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Sisa Budget</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                Rp {Math.max(0, totalRemaining).toLocaleString("id-ID")}
              </p>
            </div>
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {totalRemaining >= 0 ? "Masih tersedia" : "Melebihi budget"}
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Status</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {statusCounts.danger > 0 ? `${statusCounts.danger} ⚠️` : "Aman"}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {statusCounts.danger} kategori melebihi
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari budget berdasarkan kategori..."
                  className="w-full rounded-lg border border-blue-200 bg-white py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
              <select
                className="rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="unused">Belum Digunakan</option>
                <option value="safe">Aman</option>
                <option value="warning">Perhatian</option>
                <option value="danger">Melebihi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs font-medium text-slate-600">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                Periode Budget
              </label>
              <input
                type="month"
                className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Ringkasan Status Budget
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-700">Belum: {statusCounts.unused}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-700">Aman: {statusCounts.safe}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-xs text-yellow-700">Perhatian: {statusCounts.warning}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-red-700">Melebihi: {statusCounts.danger}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {(openForm || editingBudget) && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 shadow-lg max-w-full">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              {editingBudget ? "Edit Budget" : "Tambah Budget Baru"}
            </h3>
            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-3 sm:gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <Tag size={12} className="sm:w-3.5 sm:h-3.5" />
                Kategori Pengeluaran
              </label>
              <select
                className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Pilih Kategori</option>
                {categories
                  .filter(c => !budgets.find(b => b.categoryId === c.id && b.id !== editingBudget?.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      <span style={{ color: c.color }}>{c.icon}</span> {c.name}
                    </option>
                  ))}
              </select>
              {categoryId && budgets.find(b => b.categoryId === categoryId && b.id !== editingBudget?.id) && (
                <p className="mt-1 text-xs text-red-600">
                  Budget untuk kategori ini sudah ada
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                Limit Budget per Bulan
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                  Rp
                </div>
                <input
                  type="text"
                  placeholder="0"
                  className="w-full rounded-lg border border-blue-200 bg-white py-1.5 sm:py-2 pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formattedLimit}
                  onChange={(e) => formatCurrency(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Format: 1.000.000
              </p>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                Periode
              </label>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-xs sm:text-sm text-blue-700">
                  Budget ini berlaku untuk periode:{" "}
                  <span className="font-semibold">
                    {new Date(monthFilter + "-01").toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={editingBudget ? handleEdit : handleAdd}
              disabled={!!(categoryId && budgets.find(b => b.categoryId === categoryId && b.id !== editingBudget?.id))}
              className={`rounded-lg px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-all ${
                categoryId && budgets.find(b => b.categoryId === categoryId && b.id !== editingBudget?.id)
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {editingBudget ? "Update Budget" : "Simpan Budget"}
            </button>
            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg border border-blue-200 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* BUDGETS LIST */}
      <div>
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            Semua Budget ({filteredBudgets.length})
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Ditampilkan {currentBudgets.length} dari {filteredBudgets.length} budget
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600">Per halaman:</span>
              <select
                className="rounded-lg border border-blue-200 bg-white px-1.5 sm:px-2 py-1 text-xs sm:text-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-blue-100 bg-white p-3 sm:p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-200" />
                    <div>
                      <div className="h-3 sm:h-4 w-24 sm:w-32 rounded bg-slate-200" />
                      <div className="mt-1 h-2.5 sm:h-3 w-16 sm:w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-3 sm:h-4 w-16 sm:w-20 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 sm:p-10 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
              <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h4 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold text-slate-800">
              {searchQuery || filterStatus !== "all"
                ? "Budget tidak ditemukan"
                : "Belum ada budget"}
            </h4>
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || filterStatus !== "all"
                ? "Coba ubah filter atau kata kunci pencarian"
                : "Mulai dengan menambahkan budget pertama kamu untuk mengontrol pengeluaran"}
            </p>
            <button
              onClick={() => {
                setOpenForm(true);
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Plus size={14} className="inline mr-1 sm:mr-2" />
              Tambah Budget Pertama
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Budget / Terpakai
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {currentBudgets.map((budget) => {
                      const used = usageMap[budget.categoryId] || 0;
                      const percent = Math.min(100, Math.round((used / budget.limit) * 100));
                      const status = getBudgetStatus(budget);
                      const category = categories.find((c) => c.id === budget.categoryId);
                      
                      return (
                        <tr key={budget.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span
                                className="text-sm sm:text-lg"
                                style={{ color: category?.color || '#6b7280' }}
                              >
                                {category?.icon || '💰'}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">
                                  {category?.name || "-"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {budget.createdAt?.toDate
                                    ? `Dibuat: ${budget.createdAt.toDate().toLocaleDateString("id-ID")}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">
                                Rp {budget.limit.toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs text-slate-600">
                                Rp {used.toLocaleString("id-ID")} terpakai
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="space-y-1">
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    status === "safe"
                                      ? "bg-emerald-500"
                                      : status === "warning"
                                      ? "bg-yellow-500"
                                      : status === "danger"
                                      ? "bg-red-500"
                                      : "bg-slate-500"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-600">
                                {percent}% ({budget.limit - used >= 0 ? "Sisa: " : "Lebih: "}
                                Rp {Math.abs(budget.limit - used).toLocaleString("id-ID")})
                              </p>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span
                              className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                status === "safe"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : status === "warning"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : status === "danger"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  status === "safe"
                                    ? "bg-emerald-500"
                                    : status === "warning"
                                    ? "bg-yellow-500"
                                    : status === "danger"
                                    ? "bg-red-500"
                                    : "bg-slate-500"
                                }`}
                              />
                              <span className="hidden sm:inline">{getStatusText(status)}</span>
                              <span className="sm:hidden">
                                {status === "safe" ? "A" : status === "warning" ? "P" : status === "danger" ? "M" : "B"}
                              </span>
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              <button
                                onClick={() => setupEditForm(budget)}
                                className="rounded-lg p-1 sm:p-1.5 hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Edit budget"
                              >
                                <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                              </button>
                              <ConfirmDialog
                                title="Hapus Budget?"
                                description="Budget ini akan dihapus permanen."
                                onConfirm={() => handleDelete(budget)}
                                trigger={
                                  <button
                                    className="rounded-lg p-1 sm:p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                                    title="Hapus budget"
                                  >
                                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-3 sm:mt-4 px-2 sm:px-4 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`rounded-lg border border-blue-200 p-1.5 sm:p-2 ${
                      currentPage === 1
                        ? "cursor-not-allowed text-slate-400"
                        : "hover:bg-blue-50 text-slate-700"
                    }`}
                  >
                    <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-lg border px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm ${
                          currentPage === pageNum
                            ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                            : "border-blue-200 hover:bg-blue-50 text-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`rounded-lg border border-blue-200 p-1.5 sm:p-2 ${
                      currentPage === totalPages
                        ? "cursor-not-allowed text-slate-400"
                        : "hover:bg-blue-50 text-slate-700"
                    }`}
                  >
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QUICK TIPS - Responsive */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 sm:p-5">
        <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-blue-800">
          💡 Tips Mengelola Budget
        </h4>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-700">
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Atur budget realistis berdasarkan riwayat pengeluaran bulan sebelumnya.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Pantau progress budget secara berkala untuk menghindari kelebihan pengeluaran.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Sesuaikan budget jika diperlukan berdasarkan perubahan kebutuhan dan prioritas.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}