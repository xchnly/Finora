"use client";

import { useEffect, useState, useMemo } from "react";
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
  TrendingUp, 
  TrendingDown, 
  Download,
  Calendar,
  Wallet,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import * as XLSX from 'xlsx';

type Wallet = {
  id: string;
  name: string;
  balance: number;
  color: string;
  type: "cash" | "bank" | "digital";
  accountNumber?: string | null;
  description?: string | null;
  createdAt: Timestamp;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  transactionCount: number;
  description?: string | null;
  createdAt: Timestamp;
};

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  walletId: string;
  categoryId: string;
  date: Timestamp;
  note?: string;
  createdAt: Timestamp;
  transferToWalletId?: string;
  transferFee?: number;
};

export default function TransactionsPage() {
  const user = auth.currentUser;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTransfer, setProcessingTransfer] = useState(false);

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [openTransferForm, setOpenTransferForm] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [formattedAmount, setFormattedAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Transfer form state
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [formattedTransferAmount, setFormattedTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferNote, setTransferNote] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [formattedTransferFee, setFormattedTransferFee] = useState("");

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showBalance, setShowBalance] = useState(true);

  // 🔥 LOAD WALLETS
  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      collection(db, "users", user.uid, "wallets"),
      (snap) => {
        const walletsData = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "",
          balance: d.data().balance || 0,
          color: d.data().color || "#3b82f6",
          type: d.data().type || "cash",
          accountNumber: d.data().accountNumber || null,
          description: d.data().description || null,
          createdAt: d.data().createdAt || serverTimestamp(),
        })) as Wallet[];
        
        setWallets(walletsData);
        
        // Set default wallet if none selected
        if (!walletId && walletsData.length > 0) {
          const defaultWallet = walletsData.find(w => w.type === "cash") || walletsData[0];
          setWalletId(defaultWallet.id);
        }
        
        // Set default transfer wallets
        if (walletsData.length >= 2) {
          setFromWalletId(walletsData[0].id);
          setToWalletId(walletsData[1].id);
        } else if (walletsData.length === 1) {
          setFromWalletId(walletsData[0].id);
          setToWalletId(walletsData[0].id);
        }
      }
    );
  }, [user]);

  // 🔥 LOAD CATEGORIES
  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        const categoriesData = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "",
          type: d.data().type || "expense",
          color: d.data().color || "#6b7280",
          icon: d.data().icon || "💰",
          transactionCount: d.data().transactionCount || 0,
          description: d.data().description || null,
          createdAt: d.data().createdAt || serverTimestamp(),
        })) as Category[];
        
        setCategories(categoriesData);
        
        // Set default category if none selected
        if (!categoryId && categoriesData.length > 0) {
          const defaultCategory = categoriesData.find(c => c.type === type) || categoriesData[0];
          setCategoryId(defaultCategory.id);
        }
      }
    );
  }, [user, type]);

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

  // Format currency input
  const formatCurrency = (value: string, setFormatted: (val: string) => void, setRaw: (val: string) => void) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue) {
      const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
      setFormatted(formatted);
      setRaw(numericValue);
    } else {
      setFormatted("");
      setRaw("");
    }
  };

  // Parse formatted amount back to number
  const parseFormattedAmount = (formatted: string) => {
    return parseInt(formatted.replace(/\./g, '')) || 0;
  };

  // Get wallet icon based on type
  const getWalletIcon = (type: string) => {
    switch(type) {
      case "cash": return <Banknote size={16} />;
      case "bank": return <Landmark size={16} />;
      case "digital": return <CreditCard size={16} />;
      default: return <Wallet size={16} />;
    }
  };

  // Filter and search menggunakan useMemo
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by wallet
    if (filterWallet !== "all") {
      filtered = filtered.filter(tx => 
        tx.walletId === filterWallet || 
        (tx.type === "transfer" && tx.transferToWalletId === filterWallet)
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(tx => tx.categoryId === filterCategory);
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter(tx => {
        const txDate = tx.date.toDate();
        return txDate >= startDate && txDate <= endDate;
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        const wallet = wallets.find(w => w.id === tx.walletId);
        const category = categories.find(c => c.id === tx.categoryId);
        const toWallet = tx.type === "transfer" 
          ? wallets.find(w => w.id === tx.transferToWalletId)
          : null;
        
        return (
          tx.note?.toLowerCase().includes(query) ||
          wallet?.name.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query) ||
          (toWallet?.name.toLowerCase().includes(query) || false)
        );
      });
    }

    return filtered;
  }, [transactions, filterType, filterWallet, filterCategory, dateRange, searchQuery, wallets, categories]);

  // Calculate totals
  const { totalIncome, totalExpense, netBalance, totalTransfer } = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = filteredTransactions
      .filter(tx => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const transfer = filteredTransactions
      .filter(tx => tx.type === "transfer")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      totalTransfer: transfer
    };
  }, [filteredTransactions]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  // ➕ CREATE TRANSACTION
  const handleAdd = async () => {
    if (!amount || !walletId || !categoryId || !date) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const txAmount = parseFormattedAmount(formattedAmount) || parseInt(amount);
      
      await addDoc(
        collection(db, "users", user!.uid, "transactions"),
        {
          type,
          amount: txAmount,
          walletId,
          categoryId,
          date: Timestamp.fromDate(new Date(date)),
          note: note.trim() || null,
          createdAt: serverTimestamp(),
        }
      );

      // Update wallet balance
      const walletRef = doc(db, "users", user!.uid, "wallets", walletId);
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        const newBalance = type === "income" 
          ? wallet.balance + txAmount
          : wallet.balance - txAmount;
        
        await updateDoc(walletRef, {
          balance: newBalance
        });
      }

      // Update category transaction count
      const categoryRef = doc(db, "users", user!.uid, "categories", categoryId);
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        await updateDoc(categoryRef, {
          transactionCount: category.transactionCount + 1
        });
      }

      toast.success("Transaksi berhasil ditambahkan");
      resetForm();
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan transaksi");
    }
  };

  // 🔄 CREATE TRANSFER
  const handleTransfer = async () => {
    if (!fromWalletId || !toWalletId || !transferAmount || !transferDate) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    if (fromWalletId === toWalletId) {
      toast.error("Dompet asal dan tujuan tidak boleh sama");
      return;
    }

    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);
    
    if (!fromWallet || !toWallet) {
      toast.error("Dompet tidak ditemukan");
      return;
    }

    const transferAmountNum = parseFormattedAmount(formattedTransferAmount) || parseInt(transferAmount);
    const feeAmount = transferFee ? parseFormattedAmount(formattedTransferFee) || parseInt(transferFee) : 0;

    if (transferAmountNum <= 0) {
      toast.error("Jumlah transfer harus lebih dari 0");
      return;
    }

    if (fromWallet.balance < transferAmountNum + feeAmount) {
      toast.error(`Saldo dompet asal tidak mencukupi. Saldo tersedia: Rp ${fromWallet.balance.toLocaleString('id-ID')}`);
      return;
    }

    setProcessingTransfer(true);

    try {
      // Cari atau buat kategori transfer
      const transferCategory = categories.find(c => c.name.toLowerCase() === "transfer");
      let transferCategoryId = transferCategory?.id;

      if (!transferCategory) {
        // Buat kategori transfer jika belum ada
        const newCategory = await addDoc(
          collection(db, "users", user!.uid, "categories"),
          {
            name: "Transfer",
            type: "expense",
            color: "#8b5cf6",
            icon: "🔄",
            transactionCount: 0,
            description: "Transfer antar dompet",
            createdAt: serverTimestamp(),
          }
        );
        transferCategoryId = newCategory.id;
      }

      // Buat transaksi transfer
      await addDoc(
        collection(db, "users", user!.uid, "transactions"),
        {
          type: "transfer",
          amount: transferAmountNum,
          walletId: fromWalletId,
          categoryId: transferCategoryId,
          transferToWalletId: toWalletId,
          transferFee: feeAmount > 0 ? feeAmount : null,
          date: Timestamp.fromDate(new Date(transferDate)),
          note: transferNote.trim() || `Transfer dari ${fromWallet.name} ke ${toWallet.name}`,
          createdAt: serverTimestamp(),
        }
      );

      // Update saldo dompet asal (dikurangi jumlah transfer + biaya)
      const fromWalletRef = doc(db, "users", user!.uid, "wallets", fromWalletId);
      await updateDoc(fromWalletRef, {
        balance: fromWallet.balance - transferAmountNum - feeAmount
      });

      // Update saldo dompet tujuan (ditambah jumlah transfer)
      const toWalletRef = doc(db, "users", user!.uid, "wallets", toWalletId);
      await updateDoc(toWalletRef, {
        balance: toWallet.balance + transferAmountNum
      });

      // Update transaction count kategori transfer
      if (transferCategoryId && transferCategory) {
        const categoryRef = doc(db, "users", user!.uid, "categories", transferCategoryId);
        await updateDoc(categoryRef, {
          transactionCount: (transferCategory.transactionCount || 0) + 1
        });
      }

      toast.success("Transfer berhasil dilakukan");
      resetTransferForm();
      setOpenTransferForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan transfer");
    } finally {
      setProcessingTransfer(false);
    }
  };

  // ✏️ UPDATE TRANSACTION
  const handleEdit = async () => {
    if (!editingTransaction || !amount || !walletId || !categoryId || !date) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const txAmount = parseFormattedAmount(formattedAmount) || parseInt(amount);
      
      // Revert old transaction impact on wallet balance
      const oldWallet = wallets.find(w => w.id === editingTransaction.walletId);
      if (oldWallet && editingTransaction.type !== "transfer") {
        const oldWalletRef = doc(db, "users", user!.uid, "wallets", editingTransaction.walletId);
        const oldBalanceChange = editingTransaction.type === "income" 
          ? -editingTransaction.amount 
          : editingTransaction.amount;
        
        await updateDoc(oldWalletRef, {
          balance: oldWallet.balance + oldBalanceChange
        });
      }

      // Apply new transaction to selected wallet
      const newWallet = wallets.find(w => w.id === walletId);
      if (newWallet && editingTransaction.type !== "transfer") {
        const newWalletRef = doc(db, "users", user!.uid, "wallets", walletId);
        const newBalanceChange = type === "income" ? txAmount : -txAmount;
        
        await updateDoc(newWalletRef, {
          balance: newWallet.balance + newBalanceChange
        });
      }

      // Update transaction
      await updateDoc(
        doc(db, "users", user!.uid, "transactions", editingTransaction.id),
        {
          type,
          amount: txAmount,
          walletId,
          categoryId,
          date: Timestamp.fromDate(new Date(date)),
          note: note.trim() || null,
          updatedAt: serverTimestamp(),
        }
      );

      toast.success("Transaksi berhasil diperbarui");
      resetForm();
      setEditingTransaction(null);
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui transaksi");
    }
  };

  // ❌ DELETE TRANSACTION
  const handleDelete = async (transaction: Transaction) => {
    try {
      // Update wallet balance based on transaction type
      if (transaction.type === "income" || transaction.type === "expense") {
        const wallet = wallets.find(w => w.id === transaction.walletId);
        if (wallet) {
          const walletRef = doc(db, "users", user!.uid, "wallets", transaction.walletId);
          const balanceChange = transaction.type === "income" 
            ? -transaction.amount 
            : transaction.amount;
          
          await updateDoc(walletRef, {
            balance: wallet.balance + balanceChange
          });
        }
      } else if (transaction.type === "transfer") {
        // For transfer, revert both wallets
        const fromWallet = wallets.find(w => w.id === transaction.walletId);
        const toWallet = transaction.transferToWalletId 
          ? wallets.find(w => w.id === transaction.transferToWalletId)
          : null;

        if (fromWallet) {
          const fromWalletRef = doc(db, "users", user!.uid, "wallets", transaction.walletId);
          await updateDoc(fromWalletRef, {
            balance: fromWallet.balance + transaction.amount + (transaction.transferFee || 0)
          });
        }

        if (toWallet) {
          const toWalletRef = doc(db, "users", user!.uid, "wallets", transaction.transferToWalletId!);
          await updateDoc(toWalletRef, {
            balance: toWallet.balance - transaction.amount
          });
        }
      }

      // Update category transaction count
      const category = categories.find(c => c.id === transaction.categoryId);
      if (category) {
        const categoryRef = doc(db, "users", user!.uid, "categories", transaction.categoryId);
        await updateDoc(categoryRef, {
          transactionCount: Math.max(0, category.transactionCount - 1)
        });
      }

      // Delete transaction
      await deleteDoc(
        doc(db, "users", user!.uid, "transactions", transaction.id)
      );
      toast.success("Transaksi berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus transaksi");
    }
  };

  // Setup form for editing
  const setupEditForm = (transaction: Transaction) => {
    if (transaction.type === "transfer") {
      toast.error("Transaksi transfer tidak dapat diedit. Silakan hapus dan buat transfer baru.");
      return;
    }
    
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setFormattedAmount(transaction.amount.toLocaleString('id-ID'));
    setWalletId(transaction.walletId);
    setCategoryId(transaction.categoryId);
    setDate(transaction.date.toDate().toISOString().split('T')[0]);
    setNote(transaction.note || "");
    setOpenForm(true);
  };

  // Reset form
  const resetForm = () => {
    setType("expense");
    setAmount("");
    setFormattedAmount("");
    setWalletId(wallets.find(w => w.type === "cash")?.id || wallets[0]?.id || "");
    setCategoryId(categories.find(c => c.type === "expense")?.id || categories[0]?.id || "");
    setDate(new Date().toISOString().split('T')[0]);
    setNote("");
    setEditingTransaction(null);
  };

  // Reset transfer form
  const resetTransferForm = () => {
    if (wallets.length >= 2) {
      setFromWalletId(wallets[0].id);
      setToWalletId(wallets[1].id);
    } else if (wallets.length === 1) {
      setFromWalletId(wallets[0].id);
      setToWalletId(wallets[0].id);
    }
    setTransferAmount("");
    setFormattedTransferAmount("");
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferNote("");
    setTransferFee("");
    setFormattedTransferFee("");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const worksheetData = filteredTransactions.map(tx => {
      const wallet = wallets.find(w => w.id === tx.walletId);
      const category = categories.find(c => c.id === tx.categoryId);
      const toWallet = tx.type === "transfer" 
        ? wallets.find(w => w.id === tx.transferToWalletId)
        : null;
      
      return {
        Tanggal: tx.date.toDate().toLocaleDateString('id-ID'),
        Waktu: tx.date.toDate().toLocaleTimeString('id-ID'),
        Tipe: tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
        Jumlah: tx.amount,
        FormatJumlah: `${tx.type === 'expense' ? '-' : ''}Rp ${tx.amount.toLocaleString('id-ID')}`,
        Wallet: wallet?.name || '-',
        TipeWallet: wallet?.type === 'cash' ? 'Tunai' : wallet?.type === 'bank' ? 'Bank' : 'Digital',
        SaldoWallet: wallet?.balance || 0,
        TransferKe: tx.type === 'transfer' ? toWallet?.name || '-' : '-',
        BiayaTransfer: tx.transferFee || 0,
        Kategori: category?.name || '-',
        IconKategori: category?.icon || '💰',
        Catatan: tx.note || '',
        Dibuat: tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('id-ID') : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    
    // Auto-size columns
    const colWidths = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, 
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, 
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, 
      { wch: 30 }, { wch: 12 }
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `transaksi-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor ke Excel");
  };

  const filteredCategories = categories.filter(
    (c) => c.type === type
  );

  return (
    <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
            Catat dan kelola semua pemasukan, pengeluaran, dan transfer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showBalance ? <EyeOff size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{showBalance ? "Sembunyikan" : "Tampilkan"}</span>
            <span className="sm:hidden">{showBalance ? "Tutup" : "Buka"}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => setOpenTransferForm(true)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-purple-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <ArrowRightLeft size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Transfer</span>
            <span className="sm:hidden">Transfer</span>
          </button>
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Total Income</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance ? `Rp ${totalIncome.toLocaleString("id-ID")}` : "******"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {filteredTransactions.filter(t => t.type === 'income').length} transaksi
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Total Expense</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance ? `Rp ${totalExpense.toLocaleString("id-ID")}` : "******"}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {filteredTransactions.filter(t => t.type === 'expense').length} transaksi
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Total Transfer</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance ? `Rp ${totalTransfer.toLocaleString("id-ID")}` : "******"}
              </p>
            </div>
            <ArrowRightLeft className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {filteredTransactions.filter(t => t.type === 'transfer').length} transaksi
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Net Balance</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showBalance ? `Rp ${netBalance.toLocaleString("id-ID")}` : "******"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {netBalance >= 0 ? "Surplus" : "Defisit"}
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
                  placeholder="Cari transaksi berdasarkan catatan, wallet, atau kategori..."
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Semua Tipe</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Wallet</label>
              <select
                className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterWallet}
                onChange={(e) => setFilterWallet(e.target.value)}
              >
                <option value="all">Semua Wallet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Rp {showBalance ? w.balance.toLocaleString('id-ID') : '******'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Kategori</label>
              <select
                className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} ({c.transactionCount})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Dari Tanggal</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Sampai Tanggal</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSFER FORM */}
      {openTransferForm && (
        <div className="rounded-xl border border-purple-200 bg-white p-4 sm:p-5 shadow-lg max-w-full">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-purple-800">
              Transfer Antar Dompet
            </h3>
            <button
              onClick={() => {
                setOpenTransferForm(false);
                resetTransferForm();
              }}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  Dari Dompet
                </label>
                <select
                  className="w-full rounded-lg border border-purple-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                >
                  <option value="">Pilih Dompet Asal</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: w.color }}>{getWalletIcon(w.type)}</span>
                        {w.name} (Rp {showBalance ? w.balance.toLocaleString('id-ID') : '******'})
                      </div>
                    </option>
                  ))}
                </select>
                {fromWalletId && (
                  <p className="mt-1 text-xs text-slate-500">
                    Saldo tersedia: Rp {wallets.find(w => w.id === fromWalletId)?.balance.toLocaleString('id-ID') || '0'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <ArrowDownRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  Ke Dompet
                </label>
                <select
                  className="w-full rounded-lg border border-purple-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                >
                  <option value="">Pilih Dompet Tujuan</option>
                  {wallets.filter(w => w.id !== fromWalletId).map((w) => (
                    <option key={w.id} value={w.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: w.color }}>{getWalletIcon(w.type)}</span>
                        {w.name} (Rp {showBalance ? w.balance.toLocaleString('id-ID') : '******'})
                      </div>
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                  Tanggal Transfer
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-purple-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                  Jumlah Transfer
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                    Rp
                  </div>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-lg border border-purple-200 bg-white py-1.5 sm:py-2 pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    value={formattedTransferAmount}
                    onChange={(e) => formatCurrency(e.target.value, setFormattedTransferAmount, setTransferAmount)}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                  Biaya Transfer (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                    Rp
                  </div>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-lg border border-purple-200 bg-white py-1.5 sm:py-2 pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    value={formattedTransferFee}
                    onChange={(e) => formatCurrency(e.target.value, setFormattedTransferFee, setTransferFee)}
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Biaya admin atau biaya transfer lainnya
                </p>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
                  Catatan (Opsional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-purple-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Tambahkan catatan untuk transfer ini..."
                  rows={2}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {fromWalletId && toWalletId && fromWalletId !== toWalletId && (
            <div className="mt-3 sm:mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm font-medium text-purple-800 mb-1">Ringkasan Transfer:</p>
              <div className="text-xs sm:text-sm text-slate-700 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Dari:</span>
                  <span className="inline-flex items-center gap-1">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: wallets.find(w => w.id === fromWalletId)?.color || '#8b5cf6' }}
                    />
                    {wallets.find(w => w.id === fromWalletId)?.name}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Ke:</span>
                  <span className="inline-flex items-center gap-1">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: wallets.find(w => w.id === toWalletId)?.color || '#8b5cf6' }}
                    />
                    {wallets.find(w => w.id === toWalletId)?.name}
                  </span>
                </p>
                <p>• Jumlah Transfer: <span className="font-medium">Rp {formattedTransferAmount || '0'}</span></p>
                <p>• Biaya Transfer: <span className="font-medium">Rp {formattedTransferFee || '0'}</span></p>
                <p className="font-medium pt-2 border-t border-purple-100">
                  • Total yang dikurangi dari dompet asal: Rp {(parseFormattedAmount(formattedTransferAmount) + parseFormattedAmount(formattedTransferFee)).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleTransfer}
              disabled={processingTransfer || fromWalletId === toWalletId}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingTransfer ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={14} />
                  Proses Transfer
                </>
              )}
            </button>
            <button
              onClick={() => {
                setOpenTransferForm(false);
                resetTransferForm();
              }}
              className="rounded-lg border border-purple-200 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM */}
      {(openForm || editingTransaction) && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 shadow-lg max-w-full">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              {editingTransaction ? "Edit Transaksi" : "Tambah Transaksi Baru"}
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

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex items-center justify-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-all ${
                      type === "income"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-blue-100 hover:bg-blue-50"
                    }`}
                  >
                    <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                    <span>Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex items-center justify-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-all ${
                      type === "expense"
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-blue-100 hover:bg-blue-50"
                    }`}
                  >
                    <TrendingDown size={14} className="sm:w-4 sm:h-4" />
                    <span>Expense</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                  Jumlah
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                    Rp
                  </div>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-lg border border-blue-200 bg-white py-1.5 sm:py-2 pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formattedAmount}
                    onChange={(e) => formatCurrency(e.target.value, setFormattedAmount, setAmount)}
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
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <Wallet size={12} className="sm:w-3.5 sm:h-3.5" />
                  Wallet
                </label>
                <select
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  <option value="">Pilih Wallet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: w.color }}>{getWalletIcon(w.type)}</span>
                        {w.name} (Rp {showBalance ? w.balance.toLocaleString('id-ID') : '******'})
                      </div>
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <Tag size={12} className="sm:w-3.5 sm:h-3.5" />
                  Kategori
                </label>
                <select
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Pilih Kategori</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      <span style={{ color: c.color }}>{c.icon}</span> {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
                  Catatan (Opsional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tambahkan catatan untuk transaksi ini..."
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={editingTransaction ? handleEdit : handleAdd}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {editingTransaction ? "Update Transaksi" : "Simpan Transaksi"}
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

      {/* TRANSACTIONS LIST */}
      <div>
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            Semua Transaksi ({filteredTransactions.length})
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Ditampilkan {currentTransactions.length} dari {filteredTransactions.length} transaksi
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
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 sm:p-10 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h4 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold text-slate-800">
              {searchQuery || filterType !== "all" || filterWallet !== "all" || filterCategory !== "all" 
                ? "Transaksi tidak ditemukan" 
                : "Belum ada transaksi"}
            </h4>
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || filterType !== "all" || filterWallet !== "all" || filterCategory !== "all"
                ? "Coba ubah filter atau kata kunci pencarian"
                : "Mulai dengan menambahkan transaksi pertama kamu untuk melacak keuangan"}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setOpenTransferForm(true)}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-purple-700 hover:to-violet-700 transition-all"
              >
                <ArrowRightLeft size={14} className="inline mr-1 sm:mr-2" />
                Buat Transfer Pertama
              </button>
              <button
                onClick={() => {
                  setOpenForm(true);
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterWallet("all");
                  setFilterCategory("all");
                }}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <Plus size={14} className="inline mr-1 sm:mr-2" />
                Tambah Transaksi
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Detail
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 uppercase tracking-wider">
                        Catatan
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {currentTransactions.map((tx) => {
                      const wallet = wallets.find(w => w.id === tx.walletId);
                      const category = categories.find(c => c.id === tx.categoryId);
                      const toWallet = tx.type === "transfer" 
                        ? wallets.find(w => w.id === tx.transferToWalletId)
                        : null;
                      
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">
                                {tx.date.toDate().toLocaleDateString("id-ID", {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-slate-500">
                                {tx.date.toDate().toLocaleTimeString("id-ID", {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              tx.type === 'income' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : tx.type === 'expense'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {tx.type === 'income' ? (
                                <>
                                  <TrendingUp size={10} />
                                  <span className="hidden sm:inline">Income</span>
                                  <span className="sm:hidden">In</span>
                                </>
                              ) : tx.type === 'expense' ? (
                                <>
                                  <TrendingDown size={10} />
                                  <span className="hidden sm:inline">Expense</span>
                                  <span className="sm:hidden">Ex</span>
                                </>
                              ) : (
                                <>
                                  <ArrowRightLeft size={10} />
                                  <span className="hidden sm:inline">Transfer</span>
                                  <span className="sm:hidden">Trf</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className={`font-semibold ${
                              tx.type === 'income' ? 'text-emerald-600' : 
                              tx.type === 'expense' ? 'text-red-600' : 
                              'text-purple-600'
                            }`}>
                              {showBalance ? (
                                <>
                                  {tx.type === 'expense' && '-'}Rp {tx.amount.toLocaleString("id-ID")}
                                  {tx.type === 'transfer' && tx.transferFee && tx.transferFee > 0 && (
                                    <div className="text-xs text-slate-500">
                                      + fee: Rp {tx.transferFee.toLocaleString("id-ID")}
                                    </div>
                                  )}
                                </>
                              ) : (
                                "******"
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            {tx.type === "transfer" ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-red-400" />
                                  <span className="text-xs text-slate-600">Dari:</span>
                                  <span className="text-xs font-medium truncate max-w-[80px] sm:max-w-none">{wallet?.name || "-"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-green-400" />
                                  <span className="text-xs text-slate-600">Ke:</span>
                                  <span className="text-xs font-medium truncate max-w-[80px] sm:max-w-none">{toWallet?.name || "-"}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div 
                                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: wallet?.color || '#3b82f6' }}
                                />
                                <span className="font-medium text-slate-800 truncate max-w-[100px] sm:max-w-none">{wallet?.name || "-"}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span 
                                className="text-sm sm:text-lg flex-shrink-0"
                                style={{ color: category?.color || '#6b7280' }}
                              >
                                {category?.icon || '💰'}
                              </span>
                              <span className="truncate max-w-[80px] sm:max-w-none">{category?.name || "-"}</span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3">
                            <span className="text-slate-600 line-clamp-1">
                              {tx.note || "-"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              {tx.type !== "transfer" && (
                                <button
                                  onClick={() => setupEditForm(tx)}
                                  className="rounded-lg p-1 sm:p-1.5 hover:bg-blue-50 text-blue-600 transition-colors"
                                  title="Edit transaksi"
                                >
                                  <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                              )}
                              <ConfirmDialog
                                title="Hapus Transaksi?"
                                description="Transaksi ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
                                onConfirm={() => handleDelete(tx)}
                                trigger={
                                  <button
                                    className="rounded-lg p-1 sm:p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                                    title="Hapus transaksi"
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`rounded-lg border border-blue-200 p-1.5 sm:p-2 ${
                      currentPage === 1
                        ? 'cursor-not-allowed text-slate-400'
                        : 'hover:bg-blue-50 text-slate-700'
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
                            ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
                            : 'border-blue-200 hover:bg-blue-50 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`rounded-lg border border-blue-200 p-1.5 sm:p-2 ${
                      currentPage === totalPages
                        ? 'cursor-not-allowed text-slate-400'
                        : 'hover:bg-blue-50 text-slate-700'
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
        <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-blue-800">💡 Tips Mengelola Transaksi</h4>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-700">
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Catat transaksi segera setelah terjadi untuk akurasi data.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Gunakan fitur transfer untuk memindahkan dana antar dompet dengan mudah.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Export data ke Excel untuk analisis lebih lanjut atau backup berkala.</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>Gunakan filter untuk melihat pola pengeluaran berdasarkan kategori atau periode.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}