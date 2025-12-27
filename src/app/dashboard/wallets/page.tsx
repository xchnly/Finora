"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Download,
  Search,
  CreditCard,
  Wallet,
  Building,
  Smartphone,
} from "lucide-react";
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
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import ConfirmDialog from "../../../components/ConfirmDialog";
import WalletCard from "../../../components/WalletCard";

type Wallet = {
  id: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  createdAt: Timestamp | null;
  description?: string;
  accountNumber?: string;
};

type WalletType = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
};

export default function WalletsPage() {
  const user = auth.currentUser;
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showBalance, setShowBalance] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [color, setColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [openForm, setOpenForm] = useState(false);

  // Wallet types
  const walletTypes: WalletType[] = [
    { id: "cash", name: "Cash", icon: <Wallet size={18} />, color: "#10b981" },
    {
      id: "bank",
      name: "Bank",
      icon: <Building size={18} />,
      color: "#3b82f6",
    },
    {
      id: "ewallet",
      name: "E-Wallet",
      icon: <Smartphone size={18} />,
      color: "#8b5cf6",
    },
    {
      id: "credit",
      name: "Credit Card",
      icon: <CreditCard size={18} />,
      color: "#ef4444",
    },
    { id: "investment", name: "Investment", icon: "📈", color: "#f59e0b" },
    { id: "other", name: "Other", icon: "💼", color: "#6b7280" },
  ];

  // READ (Realtime)
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "wallets");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data: Wallet[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Wallet, "id">),
      }));
      setWallets(data);
      setLoading(false);

      // Calculate total balance
      const total = data.reduce((sum, wallet) => sum + wallet.balance, 0);
      setTotalBalance(total);
    });

    return () => unsub();
  }, [user]);

  // Filter and search menggunakan useMemo (PERBAIKAN UTAMA)
  const filteredWallets = useMemo(() => {
    let filtered = wallets;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((wallet) => wallet.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (wallet) =>
          wallet.name.toLowerCase().includes(query) ||
          wallet.description?.toLowerCase().includes(query) ||
          wallet.accountNumber?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [wallets, filterType, searchQuery]);

  // CREATE
  const handleAddWallet = async () => {
    if (!name.trim()) {
      toast.error("Nama wallet wajib diisi");
      return;
    }

    try {
      await addDoc(collection(db, "users", user!.uid, "wallets"), {
        name,
        type,
        color,
        balance: 0,
        description: description.trim() || null,
        accountNumber: accountNumber.trim() || null,
        createdAt: serverTimestamp(),
      });

      toast.success("Wallet berhasil ditambahkan");
      resetForm();
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan wallet");
    }
  };

  // UPDATE
  const handleEditWallet = async () => {
    if (!editingWallet || !name.trim()) {
      toast.error("Nama wallet wajib diisi");
      return;
    }

    try {
      await updateDoc(
        doc(db, "users", user!.uid, "wallets", editingWallet.id),
        {
          name,
          type,
          color,
          description: description.trim() || null,
          accountNumber: accountNumber.trim() || null,
          updatedAt: serverTimestamp(),
        }
      );

      toast.success("Wallet berhasil diperbarui");
      resetForm();
      setEditingWallet(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui wallet");
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", user!.uid, "wallets", id));
      toast.success("Wallet berhasil dihapus");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus wallet");
    }
  };

  // Setup form for editing
  const setupEditForm = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setColor(wallet.color);
    setDescription(wallet.description || "");
    setAccountNumber(wallet.accountNumber || "");
    setOpenForm(true);
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setType("cash");
    setColor("#3b82f6");
    setDescription("");
    setAccountNumber("");
    setEditingWallet(null);
  };

  // Get wallet type name
  const getWalletTypeName = (typeId: string) => {
    const found = walletTypes.find((t) => t.id === typeId);
    return found ? found.name : typeId;
  };

  // Export wallets data
  const handleExportData = () => {
    const dataStr = JSON.stringify(wallets, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `wallets-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Data berhasil diekspor");
  };

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Wallets
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            Kelola semua dompet dan rekening kamu di satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            {showBalance ? "Sembunyikan" : "Tampilkan"}
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={16} />
            Add Wallet
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Balance</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {showBalance
                  ? `Rp ${totalBalance.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <Wallet className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">
            {wallets.length} wallet aktif
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Bank Accounts</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {wallets.filter((w) => w.type === "bank").length}
              </p>
            </div>
            <Building className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">Total rekening bank</p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">E-Wallets</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">
                {wallets.filter((w) => w.type === "ewallet").length}
              </p>
            </div>
            <Smartphone className="h-10 w-10 opacity-80" />
          </div>
          <p className="mt-3 text-sm opacity-90">Digital wallet aktif</p>
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
                placeholder="Cari wallet berdasarkan nama, deskripsi, atau nomor rekening..."
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
              {walletTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {(openForm || editingWallet) && (
        <div
          className="
      fixed inset-x-0 bottom-0 z-40
      max-h-[95vh]
      bg-white
      rounded-t-2xl
      shadow-2xl
      flex flex-col

      md:static md:z-auto
      md:max-h-none
      md:rounded-xl
      md:border md:border-blue-200
      md:shadow-lg
      md:w-full
    "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingWallet ? "Edit Wallet" : "Tambah Wallet Baru"}
            </h3>

            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 text-slate-500"
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

          {/* FORM (SCROLL AREA) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* LEFT */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nama Wallet
                  </label>
                  <input
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Contoh: BCA Tabungan, Gopay, dll"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipe Wallet
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {walletTypes.map((walletType) => (
                      <button
                        key={walletType.id}
                        type="button"
                        onClick={() => setType(walletType.id)}
                        className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm transition-all ${
                          type === walletType.id
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-blue-100 hover:bg-blue-50"
                        }`}
                      >
                        <div className="mb-1 text-lg">{walletType.icon}</div>
                        <span>{walletType.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Warna
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-16 cursor-pointer rounded-lg border"
                    />
                    <div
                      className="h-10 w-10 rounded-lg"
                      style={{ backgroundColor: color }}
                    />
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
                    Nomor Rekening/Akun (Opsional)
                  </label>
                  <input
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Contoh: 123-456-7890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Tambahkan catatan tentang wallet ini..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BAR (STICKY) */}
          <div className="border-t bg-white p-4 flex gap-3">
            <button
              onClick={editingWallet ? handleEditWallet : handleAddWallet}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {editingWallet ? "Update Wallet" : "Simpan Wallet"}
            </button>

            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="flex-1 rounded-lg border border-blue-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* WALLETS LIST */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Semua Wallet ({filteredWallets.length})
          </h3>
          <p className="text-sm text-slate-600">
            Ditampilkan {filteredWallets.length} dari {wallets.length} wallet
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-blue-100 bg-white p-5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-slate-200" />
                    <div>
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="mt-1 h-3 w-16 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-5 w-5 rounded bg-slate-200" />
                </div>
                <div className="mt-4">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="mt-2 h-6 w-32 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-800">
              {searchQuery || filterType !== "all"
                ? "Wallet tidak ditemukan"
                : "Belum ada wallet"}
            </h4>
            <p className="mb-6 text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || filterType !== "all"
                ? "Coba ubah kata kunci pencarian atau filter yang kamu gunakan"
                : "Mulai dengan menambahkan wallet pertama kamu untuk mengelola keuangan dengan lebih baik"}
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
              Tambah Wallet Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="group relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-blue-200"
              >
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setupEditForm(wallet)}
                    className="rounded-lg p-1.5 hover:bg-blue-50 text-blue-600"
                    title="Edit wallet"
                  >
                    <Edit2 size={14} />
                  </button>
                  <ConfirmDialog
                    title="Hapus Wallet?"
                    description="Wallet ini akan dihapus permanen. Transaksi yang terkait tidak akan terhapus."
                    onConfirm={() => handleDelete(wallet.id)}
                    trigger={
                      <button
                        className="rounded-lg p-1.5 hover:bg-red-50 text-red-600"
                        title="Hapus wallet"
                      >
                        <Trash2 size={14} />
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: wallet.color }}
                  >
                    {walletTypes.find((t) => t.id === wallet.type)?.icon || (
                      <Wallet size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-base font-semibold text-slate-800">
                      {wallet.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {getWalletTypeName(wallet.type)}
                      {wallet.accountNumber && ` • ${wallet.accountNumber}`}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Saldo
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {showBalance
                      ? `Rp ${wallet.balance.toLocaleString("id-ID")}`
                      : "••••••"}
                  </p>
                </div>

                {wallet.description && (
                  <div className="pt-4 border-t border-blue-50">
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {wallet.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Dibuat{" "}
                    {wallet.createdAt?.toDate
                      ? wallet.createdAt.toDate().toLocaleDateString("id-ID")
                      : "Baru saja"}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {wallet.balance >= 0 ? "Aktif" : "Minus"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK TIPS */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5">
        <h4 className="mb-3 text-sm font-semibold text-blue-800">
          💡 Tips Mengelola Wallet
        </h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Pisahkan wallet berdasarkan tujuan: kebutuhan sehari-hari, tabungan,
            investasi, dll.
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Update saldo secara berkala untuk mendapatkan gambaran keuangan yang
            akurat.
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Gunakan fitur filter untuk dengan mudah menemukan wallet tertentu.
          </li>
        </ul>
      </div>
    </div>
  );
}
