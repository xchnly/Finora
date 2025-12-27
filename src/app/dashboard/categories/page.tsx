"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Filter, Search, TrendingUp, TrendingDown, Palette, Type, Hash } from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon?: string;
  description?: string;
  transactionCount?: number;
  createdAt?: Timestamp;
};

type CategoryType = {
  id: "income" | "expense";
  name: string;
  icon: React.ReactNode;
  color: string;
};

export default function CategoriesPage() {
  const user = auth.currentUser;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("💰");
  const [description, setDescription] = useState("");
  const [openForm, setOpenForm] = useState(false);

  // Category types
  const categoryTypes: CategoryType[] = [
    { id: "expense", name: "Expense", icon: <TrendingDown size={18} />, color: "#ef4444" },
    { id: "income", name: "Income", icon: <TrendingUp size={18} />, color: "#10b981" },
  ];

  // Icon options
  const iconOptions = [
    "💰", "🍔", "🚗", "🏠", "📱", "🛒", "🎬", "🏥", "✈️", "🎓",
    "👕", "💡", "📚", "🎮", "☕", "🏋️", "💇", "🐶", "🎁", "💼"
  ];

  // 🔥 READ realtime dengan order
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "categories");
    const q = query(ref, orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const data: Category[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, "id">),
      }));
      setCategories(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Filter and search menggunakan useMemo
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(cat => cat.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [categories, filterType, searchQuery]);

  // Count categories by type
  const expenseCount = categories.filter(c => c.type === "expense").length;
  const incomeCount = categories.filter(c => c.type === "income").length;

  // ➕ CREATE
  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    try {
      await addDoc(collection(db, "users", user!.uid, "categories"), {
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim() || null,
        transactionCount: 0,
        createdAt: serverTimestamp(),
      });

      toast.success("Kategori berhasil ditambahkan");
      resetForm();
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan kategori");
    }
  };

  // ✏️ UPDATE
  const handleEdit = async () => {
    if (!editingCategory || !name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user!.uid, "categories", editingCategory.id), {
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim() || null,
        updatedAt: serverTimestamp(),
      });

      toast.success("Kategori berhasil diperbarui");
      resetForm();
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui kategori");
    }
  };

  // ❌ DELETE
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", user!.uid, "categories", id));
      toast.success("Kategori berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  // Setup form for editing
  const setupEditForm = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setColor(category.color);
    setIcon(category.icon || "💰");
    setDescription(category.description || "");
    setOpenForm(true);
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setType("expense");
    setColor("#3b82f6");
    setIcon("💰");
    setDescription("");
    setEditingCategory(null);
  };

  return (
    <div className="max-w-full overflow-x-hidden px-4 md:px-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Categories
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            Kelola kategori income dan expense untuk mengorganisir transaksi kamu.
          </p>
        </div>

        <button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Kategori</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {categories.length}
              </p>
            </div>
            <Hash className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">
            Untuk mengatur semua transaksi
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Expense</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {expenseCount}
              </p>
            </div>
            <TrendingDown className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">
            Kategori pengeluaran
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Income</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {incomeCount}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">
            Kategori pemasukan
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kategori berdasarkan nama atau deskripsi..."
                className="w-full rounded-lg border border-blue-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              {categoryTypes.map((catType) => (
                <option key={catType.id} value={catType.id}>
                  {catType.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {(openForm || editingCategory) && (
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-lg max-w-full">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h3>
            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Type size={14} />
                  Nama Kategori
                </label>
                <input
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Contoh: Makanan, Transportasi, Gaji, dll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <TrendingUp size={14} />
                  Tipe Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryTypes.map((catType) => (
                    <button
                      key={catType.id}
                      type="button"
                      onClick={() => setType(catType.id)}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                        type === catType.id
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-blue-100 hover:bg-blue-50"
                      }`}
                    >
                      {catType.icon}
                      <span>{catType.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Palette size={14} />
                  Ikon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setIcon(ico)}
                      className={`flex items-center justify-center rounded-lg border p-2 text-lg transition-all ${
                        icon === ico
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-blue-100 hover:bg-blue-50"
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Warna</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border"
                  />
                  <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: color }} />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tambahkan deskripsi untuk kategori ini..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-800">Tips:</p>
                <p className="mt-1 text-xs text-blue-700">
                  Buat kategori yang spesifik untuk melacak pengeluaran dengan lebih detail.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={editingCategory ? handleEdit : handleAdd}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {editingCategory ? "Update Kategori" : "Simpan Kategori"}
            </button>
            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg border border-blue-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES LIST */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Semua Kategori ({filteredCategories.length})
          </h3>
          <p className="text-sm text-slate-600">
            Ditampilkan {filteredCategories.length} dari {categories.length} kategori
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-blue-100 bg-white p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-200" />
                    <div>
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="mt-1 h-3 w-16 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-5 w-5 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Hash className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-800">
              {searchQuery || filterType !== "all" ? "Kategori tidak ditemukan" : "Belum ada kategori"}
            </h4>
            <p className="mb-6 text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || filterType !== "all"
                ? "Coba ubah kata kunci pencarian atau filter yang kamu gunakan"
                : "Mulai dengan menambahkan kategori pertama untuk mengorganisir transaksi kamu"}
            </p>
            <button
              onClick={() => {
                setOpenForm(true);
                setSearchQuery("");
                setFilterType("all");
              }}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Plus size={16} className="inline mr-2" />
              Tambah Kategori Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-blue-200"
              >
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setupEditForm(category)}
                    className="rounded-lg p-1.5 hover:bg-blue-50 text-blue-600"
                    title="Edit kategori"
                  >
                    <Edit2 size={14} />
                  </button>
                  <ConfirmDialog
                    title="Hapus Kategori?"
                    description="Kategori ini akan dihapus permanen. Pastikan tidak ada transaksi yang menggunakan kategori ini."
                    onConfirm={() => handleDelete(category.id)}
                    trigger={
                      <button
                        className="rounded-lg p-1.5 hover:bg-red-50 text-red-600"
                        title="Hapus kategori"
                      >
                        <Trash2 size={14} />
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-xl">{category.icon || "💰"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-base font-semibold text-slate-800">
                      {category.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                        category.type === 'income' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {category.type === 'income' ? (
                          <>
                            <TrendingUp size={10} />
                            Income
                          </>
                        ) : (
                          <>
                            <TrendingDown size={10} />
                            Expense
                          </>
                        )}
                      </span>
                    </p>
                  </div>
                </div>

                {category.description && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {category.createdAt?.toDate ? 
                      `Dibuat ${category.createdAt.toDate().toLocaleDateString('id-ID')}` : 
                      'Baru saja'
                    }
                  </span>
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {category.transactionCount || 0} transaksi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK TIPS */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5">
        <h4 className="mb-3 text-sm font-semibold text-blue-800">💡 Tips Mengelola Kategori</h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Gunakan kategori yang spesifik untuk melacak pengeluaran dengan lebih detail.
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Pisahkan kategori income dan expense untuk analisis keuangan yang lebih baik.
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Tambahkan deskripsi untuk mengingat tujuan dari setiap kategori.
          </li>
        </ul>
      </div>
    </div>
  );
}