"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
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
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Target,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  CreditCard,
  Wallet,
  CalendarDays,
  PieChart,
  RefreshCw,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

type Loan = {
  id: string;
  name: string;
  dueDay: number;
  status: "active" | "paid" | "overdue";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  interestRate?: number;
  type: "personal" | "mortgage" | "vehicle" | "education" | "other";
  lender?: string;
  accountNumber?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

interface LoanSchedule {
  id: string;
  loanId: string;
  month: number;
  amount: number;
  principal: number;
  interest: number;
  dueDate: Timestamp;
  paid: boolean;
  paidAt?: Timestamp;
  status: "pending" | "paid" | "overdue";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface LoanPayment {
  id: string;
  loanId: string;
  scheduleId: string;
  amount: number;
  paymentDate: Timestamp;
  method: string;
  notes: string;
  createdAt: Timestamp;
}

type Schedule = {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  principal: number;
  interest: number;
  paid: boolean;
  paidAt?: Timestamp;
  dueDate: Timestamp;
  status: "pending" | "paid" | "overdue";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

type PaymentHistory = {
  id: string;
  loanId: string;
  scheduleId: string;
  amount: number;
  paymentDate: Timestamp;
  method: "cash" | "transfer" | "auto-debit";
  notes?: string;
  createdAt: Timestamp;
};

type EditScheduleState = {
  loanId: string;
  scheduleId: string;
  amount: number;
  originalAmount: number;
  originalPrincipal: number;
  originalInterest: number;
};

type EditAllSchedulesState = {
  loanId: string;
  schedules: Array<{
    id: string;
    amount: number;
    principal: number;
    interest: number;
    paid: boolean;
  }>;
};

export default function LoansPage() {
  const user = auth.currentUser;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({});
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [name, setName] = useState("");
  const [dueDay, setDueDay] = useState("25");
  const [loanType, setLoanType] = useState<Loan["type"]>("personal");
  const [totalAmount, setTotalAmount] = useState("");
  const [formattedTotalAmount, setFormattedTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [lender, setLender] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0]
  );
  const [scheduleCount, setScheduleCount] = useState("12");

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit schedule state
  const [editingSchedule, setEditingSchedule] =
    useState<EditScheduleState | null>(null);
  const [editScheduleAmount, setEditScheduleAmount] = useState("");
  const [editAllSchedulesModal, setEditAllSchedulesModal] =
    useState<EditAllSchedulesState | null>(null);
  const [showAllSchedulesModal, setShowAllSchedulesModal] = useState<
    string | null
  >(null);

  // 🔥 LOAD LOANS
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "loans");
    const q = query(ref, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      const data: Loan[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          dueDay: data.dueDay || 1,
          status: data.status || "active",
          totalAmount: data.totalAmount || 0,
          paidAmount: data.paidAmount || 0,
          remainingAmount: data.remainingAmount || 0,
          startDate: data.startDate || Timestamp.now(),
          endDate: data.endDate,
          interestRate: data.interestRate,
          type: data.type || "personal",
          lender: data.lender,
          accountNumber: data.accountNumber,
          notes: data.notes,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt,
        };
      });
      setLoans(data);
    });
  }, [user]);

  // 🔥 LOAD SCHEDULES PER LOAN
  useEffect(() => {
    if (!user) return;

    const unsubscribers: Array<() => void> = [];

    loans.forEach((loan) => {
      const ref = collection(
        db,
        "users",
        user.uid,
        "loans",
        loan.id,
        "schedules"
      );
      const q = query(ref, orderBy("dueDate", "asc"));

      const unsubscribe = onSnapshot(q, (snap) => {
        const scheduleData = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            month: data.month || "",
            amount: data.amount || 0,
            principal: data.principal || 0,
            interest: data.interest || 0,
            paid: data.paid || false,
            paidAt: data.paidAt,
            dueDate: data.dueDate || Timestamp.now(),
            status: data.status || "pending",
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt,
          };
        });

        setSchedules((prev) => ({
          ...prev,
          [loan.id]: scheduleData,
        }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [loans, user]);

  // 🔥 LOAD PAYMENT HISTORY
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "loanPayments");
    const q = query(ref, orderBy("paymentDate", "desc"));

    return onSnapshot(q, (snap) => {
      const data: PaymentHistory[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          loanId: data.loanId || "",
          scheduleId: data.scheduleId || "",
          amount: data.amount || 0,
          paymentDate: data.paymentDate || Timestamp.now(),
          method: data.method || "cash",
          notes: data.notes,
          createdAt: data.createdAt || Timestamp.now(),
        };
      });
      setPaymentHistory(data);
      setLoading(false);
    });
  }, [user]);

  // Format currency input
  const formatCurrency = (
    value: string,
    setter: (value: string) => void,
    formattedSetter: (value: string) => void
  ) => {
    const numericValue = value.replace(/\D/g, "");

    if (numericValue) {
      const formatted = new Intl.NumberFormat("id-ID").format(
        parseInt(numericValue)
      );
      formattedSetter(formatted);
      setter(numericValue);
    } else {
      formattedSetter("");
      setter("");
    }
  };

  // Parse formatted amount back to number
  const parseFormattedAmount = (formatted: string) => {
    return parseInt(formatted.replace(/\./g, "")) || 0;
  };

  // Generate schedules based on loan details
  const generateSchedules = () => {
    if (!totalAmount || !scheduleCount || !startDate) return [];

    const schedules = [];
    const principal =
      parseFormattedAmount(formattedTotalAmount) || Number(totalAmount);
    const monthlyPrincipal = principal / Number(scheduleCount);
    const monthlyInterest =
      (principal * (Number(interestRate) || 0)) / 100 / 12;
    const monthlyAmount = monthlyPrincipal + monthlyInterest;

    const start = new Date(startDate);

    for (let i = 0; i < Number(scheduleCount); i++) {
      const scheduleDate = new Date(start);
      scheduleDate.setMonth(scheduleDate.getMonth() + i);

      const dueDate = new Date(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        Number(dueDay)
      );

      schedules.push({
        month: scheduleDate.toISOString().slice(0, 7),
        amount: Math.round(monthlyAmount),
        principal: Math.round(monthlyPrincipal),
        interest: Math.round(monthlyInterest),
        paid: false,
        dueDate: Timestamp.fromDate(dueDate),
        status: "pending" as const,
        createdAt: Timestamp.now(),
      });
    }

    return schedules;
  };

  // Calculate loan statistics
  const loanStats = useMemo(() => {
    const stats = {
      totalActiveLoans: 0,
      totalMonthlyPayment: 0,
      totalPaid: 0,
      totalRemaining: 0,
      overdueLoans: 0,
      upcomingPayments: 0,
      totalThisMonth: 0,
    };

    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date();

    loans.forEach((loan) => {
      if (loan.status === "active") {
        stats.totalActiveLoans++;
        stats.totalRemaining += loan.remainingAmount;
        stats.totalPaid += loan.paidAmount;
      }

      // ✅ FIX: Perbaikan perbandingan status overdue
      if (loan.status === "overdue") {
        stats.overdueLoans++;
      }

      const loanSchedules = schedules[loan.id] || [];
      loanSchedules.forEach((schedule) => {
        if (schedule.month === currentMonth && !schedule.paid) {
          stats.totalThisMonth += schedule.amount;
          stats.totalMonthlyPayment += schedule.amount;
        }

        if (!schedule.paid && schedule.dueDate.toDate() > today) {
          stats.upcomingPayments++;
        }
      });
    });

    return stats;
  }, [loans, schedules]);

  // Get overdue schedules
  const overdueSchedules = useMemo(() => {
    const overdue: Array<{ loan: Loan; schedule: Schedule }> = [];
    const today = new Date();

    loans.forEach((loan) => {
      const loanSchedules = schedules[loan.id] || [];
      loanSchedules.forEach((schedule) => {
        if (!schedule.paid && schedule.dueDate.toDate() < today) {
          overdue.push({ loan, schedule });
        }
      });
    });

    return overdue;
  }, [loans, schedules]);

  // Get upcoming schedules (next 30 days)
  const upcomingSchedules = useMemo(() => {
    const upcoming: Array<{ loan: Loan; schedule: Schedule }> = [];
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    loans.forEach((loan) => {
      const loanSchedules = schedules[loan.id] || [];
      loanSchedules.forEach((schedule) => {
        const dueDate = schedule.dueDate.toDate();
        if (!schedule.paid && dueDate >= today && dueDate <= next30Days) {
          upcoming.push({ loan, schedule });
        }
      });
    });

    return upcoming.sort(
      (a, b) =>
        a.schedule.dueDate.toDate().getTime() -
        b.schedule.dueDate.toDate().getTime()
    );
  }, [loans, schedules]);

  // Filter loans
  const filteredLoans = useMemo(() => {
    let filtered = loans;

    // Filter by search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          loan.name.toLowerCase().includes(query) ||
          loan.lender?.toLowerCase().includes(query) ||
          loan.accountNumber?.includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((loan) => loan.status === filterStatus);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((loan) => loan.type === filterType);
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter((loan) => {
        const loanDate = loan.createdAt.toDate();
        return loanDate >= startDate && loanDate <= endDate;
      });
    }

    return filtered;
  }, [loans, searchQuery, filterStatus, filterType, dateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLoans = filteredLoans.slice(indexOfFirstItem, indexOfLastItem);

  // Get loan type icon and color
  const getLoanTypeInfo = (type: Loan["type"]) => {
    switch (type) {
      case "personal":
        return { icon: "👤", color: "#3b82f6", label: "Personal" };
      case "mortgage":
        return { icon: "🏠", color: "#10b981", label: "Mortgage" };
      case "vehicle":
        return { icon: "🚗", color: "#f59e0b", label: "Vehicle" };
      case "education":
        return { icon: "🎓", color: "#8b5cf6", label: "Education" };
      case "other":
        return { icon: "📝", color: "#6b7280", label: "Other" };
      default:
        return { icon: "💰", color: "#6b7280", label: "Loan" };
    }
  };

  // Utility function untuk membersihkan data dengan type safety yang lebih baik
  const cleanLoanData = <T extends object>(data: T): Partial<T> => {
    const cleaned: Partial<T> = {};

    (Object.keys(data) as Array<keyof T>).forEach((key) => {
      const value = data[key];
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });

    return cleaned;
  };

  // ➕ CREATE LOAN + SCHEDULES
  const handleAddLoan = async () => {
    if (!user) {
      toast.error("User tidak ditemukan");
      return;
    }

    if (!name || !totalAmount || !startDate || !dueDay) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const principal =
        parseFormattedAmount(formattedTotalAmount) || Number(totalAmount);
      const generatedSchedules = generateSchedules();
      const totalAmountWithInterest = generatedSchedules.reduce(
        (sum, s) => sum + s.amount,
        0
      );

      const loanData = cleanLoanData({
        name,
        dueDay: Number(dueDay),
        status: "active" as const,
        type: loanType,
        totalAmount: totalAmountWithInterest,
        paidAmount: 0,
        remainingAmount: totalAmountWithInterest,
        interestRate: interestRate ? Number(interestRate) : undefined,
        lender: lender || undefined,
        accountNumber: accountNumber || undefined,
        notes: notes || undefined,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : undefined,
        createdAt: Timestamp.now(),
      });

      const loanRef = await addDoc(
        collection(db, "users", user.uid, "loans"),
        loanData
      );

      // Add schedules
      for (const schedule of generatedSchedules) {
        const scheduleData = cleanLoanData({
          ...schedule,
          loanId: loanRef.id,
          createdAt: Timestamp.now(),
        });

        await addDoc(
          collection(db, "users", user.uid, "loans", loanRef.id, "schedules"),
          scheduleData
        );
      }

      toast.success("Cicilan berhasil ditambahkan");
      resetForm();
      setOpenForm(false);
    } catch (error: unknown) {
      console.error("Error adding loan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal menambahkan cicilan: ${errorMessage}`);
    }
  };

  // ✏️ UPDATE LOAN
  // ✏️ UPDATE LOAN
  const handleEditLoan = async () => {
    if (!user) {
      toast.error("User tidak ditemukan");
      return;
    }

    if (!editingLoan || !name || !totalAmount || !startDate || !dueDay) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const loanData = cleanLoanData({
        name,
        dueDay: Number(dueDay),
        type: loanType,
        interestRate: interestRate ? Number(interestRate) : undefined,
        lender: lender || undefined,
        accountNumber: accountNumber || undefined,
        notes: notes || undefined,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : undefined,
        updatedAt: Timestamp.now(),
      });

      await updateDoc(
        doc(db, "users", user.uid, "loans", editingLoan.id),
        loanData
      );

      toast.success("Cicilan berhasil diperbarui");
      resetForm();
      setEditingLoan(null);
      setOpenForm(false);
    } catch (error: unknown) {
      console.error("Error updating loan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal memperbarui cicilan: ${errorMessage}`);
    }
  };

  // ✅ MARK SCHEDULE PAID
  const markSchedulePaid = async (loanId: string, scheduleId: string) => {
    if (!user) {
      toast.error("User tidak ditemukan");
      return;
    }

    try {
      const now = Timestamp.now();
      const schedule = schedules[loanId]?.find((s) => s.id === scheduleId);

      if (!schedule) {
        toast.error("Jadwal tidak ditemukan");
        return;
      }

      // Update schedule
      await updateDoc(
        doc(db, "users", user.uid, "loans", loanId, "schedules", scheduleId),
        cleanLoanData({
          paid: true,
          paidAt: now,
          status: "paid" as const,
          updatedAt: now,
        })
      );

      // Record payment history
      const paymentData = cleanLoanData({
        loanId,
        scheduleId,
        amount: schedule.amount,
        paymentDate: now,
        method: "cash" as const,
        notes: "Pembayaran cicilan",
        createdAt: now,
      });

      await addDoc(
        collection(db, "users", user.uid, "loanPayments"),
        paymentData
      );

      // Update loan totals
      const loan = loans.find((l) => l.id === loanId);
      if (loan) {
        const newRemainingAmount = Math.max(
          0,
          loan.remainingAmount - schedule.amount
        );
        const newStatus: Loan["status"] =
          newRemainingAmount <= 0 ? "paid" : loan.status;

        await updateDoc(
          doc(db, "users", user.uid, "loans", loanId),
          cleanLoanData({
            paidAmount: loan.paidAmount + schedule.amount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            updatedAt: now,
          })
        );
      }

      toast.success("Cicilan berhasil dilunasi");
    } catch (error: unknown) {
      console.error("Error marking schedule paid:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal update cicilan: ${errorMessage}`);
    }
  };

  // ✏️ EDIT NOMINAL SCHEDULE (PER BULAN)
  const startEditSchedule = (
    loanId: string,
    scheduleId: string,
    currentAmount: number,
    currentPrincipal: number,
    currentInterest: number
  ) => {
    setEditingSchedule({
      loanId,
      scheduleId,
      amount: currentAmount,
      originalAmount: currentAmount,
      originalPrincipal: currentPrincipal,
      originalInterest: currentInterest,
    });
    setEditScheduleAmount(currentAmount.toString());
  };

  const cancelEditSchedule = () => {
    setEditingSchedule(null);
    setEditScheduleAmount("");
  };

  const saveEditSchedule = async () => {
    if (!editingSchedule || !editScheduleAmount || !user) return;

    const newAmount = parseFloat(editScheduleAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error("Nominal harus berupa angka positif");
      return;
    }

    try {
      const now = Timestamp.now();
      const schedule = schedules[editingSchedule.loanId]?.find(
        (s) => s.id === editingSchedule.scheduleId
      );

      if (!schedule) {
        toast.error("Jadwal tidak ditemukan");
        return;
      }

      // Hitung proporsi baru untuk principal dan interest
      let newPrincipal = editingSchedule.originalPrincipal;
      let newInterest = editingSchedule.originalInterest;

      if (editingSchedule.originalAmount > 0) {
        const principalRatio =
          editingSchedule.originalPrincipal / editingSchedule.originalAmount;
        const interestRatio =
          editingSchedule.originalInterest / editingSchedule.originalAmount;
        newPrincipal = Math.round(newAmount * principalRatio);
        newInterest = Math.round(newAmount * interestRatio);
      }

      // Update schedule
      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "loans",
          editingSchedule.loanId,
          "schedules",
          editingSchedule.scheduleId
        ),
        cleanLoanData({
          amount: newAmount,
          principal: newPrincipal,
          interest: newInterest,
          updatedAt: now,
        })
      );

      // Jika schedule sudah dibayar, update juga loan totals
      if (schedule.paid) {
        const loan = loans.find((l) => l.id === editingSchedule.loanId);
        if (loan) {
          const amountDifference = newAmount - editingSchedule.originalAmount;
          await updateDoc(
            doc(db, "users", user.uid, "loans", editingSchedule.loanId),
            cleanLoanData({
              paidAmount: loan.paidAmount + amountDifference,
              remainingAmount: Math.max(
                0,
                loan.remainingAmount - amountDifference
              ),
              updatedAt: now,
            })
          );
        }
      }

      toast.success("Nominal cicilan berhasil diupdate");
      cancelEditSchedule();
    } catch (error: unknown) {
      console.error("Error editing schedule:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal update nominal cicilan: ${errorMessage}`);
    }
  };

  // ✏️ EDIT SEMUA SCHEDULES SEKALIGUS
  const openEditAllSchedules = (loanId: string) => {
    const loanSchedules = schedules[loanId] || [];
    setEditAllSchedulesModal({
      loanId,
      schedules: loanSchedules.map((schedule) => ({
        id: schedule.id,
        amount: schedule.amount,
        principal: schedule.principal,
        interest: schedule.interest,
        paid: schedule.paid,
      })),
    });
  };

  const updateAllScheduleAmount = (index: number, value: string) => {
    if (!editAllSchedulesModal) return;

    const newAmount = parseFloat(value) || 0;
    const updatedSchedules = [...editAllSchedulesModal.schedules];
    const schedule = updatedSchedules[index];

    if (newAmount > 0) {
      const principalRatio = schedule.principal / schedule.amount;
      const interestRatio = schedule.interest / schedule.amount;

      updatedSchedules[index] = {
        ...schedule,
        amount: newAmount,
        principal: Math.round(newAmount * principalRatio),
        interest: Math.round(newAmount * interestRatio),
      };

      setEditAllSchedulesModal({
        ...editAllSchedulesModal,
        schedules: updatedSchedules,
      });
    }
  };

  const saveAllSchedules = async () => {
    if (!editAllSchedulesModal || !user) return;

    try {
      const now = Timestamp.now();
      let totalPaidAdjustment = 0;
      let totalRemainingAdjustment = 0;

      // Update semua schedules
      for (const schedule of editAllSchedulesModal.schedules) {
        const originalSchedule = schedules[editAllSchedulesModal.loanId]?.find(
          (s) => s.id === schedule.id
        );
        if (originalSchedule) {
          await updateDoc(
            doc(
              db,
              "users",
              user.uid,
              "loans",
              editAllSchedulesModal.loanId,
              "schedules",
              schedule.id
            ),
            cleanLoanData({
              amount: schedule.amount,
              principal: schedule.principal,
              interest: schedule.interest,
              updatedAt: now,
            })
          );

          // Hitung adjustment jika sudah dibayar
          if (originalSchedule.paid) {
            totalPaidAdjustment += schedule.amount - originalSchedule.amount;
          } else {
            totalRemainingAdjustment +=
              schedule.amount - originalSchedule.amount;
          }
        }
      }

      // Update loan totals jika ada perubahan
      if (totalPaidAdjustment !== 0 || totalRemainingAdjustment !== 0) {
        const loan = loans.find((l) => l.id === editAllSchedulesModal.loanId);
        if (loan) {
          await updateDoc(
            doc(db, "users", user.uid, "loans", editAllSchedulesModal.loanId),
            cleanLoanData({
              paidAmount: loan.paidAmount + totalPaidAdjustment,
              remainingAmount: Math.max(
                0,
                loan.remainingAmount + totalRemainingAdjustment
              ),
              totalAmount:
                loan.totalAmount +
                totalPaidAdjustment +
                totalRemainingAdjustment,
              updatedAt: now,
            })
          );
        }
      }

      toast.success("Semua jadwal berhasil diupdate");
      setEditAllSchedulesModal(null);
    } catch (error: unknown) {
      console.error("Error saving all schedules:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal update semua jadwal: ${errorMessage}`);
    }
  };

  // ❌ DELETE LOAN
  const deleteLoan = async (loanId: string) => {
    if (!user) {
      toast.error("User tidak ditemukan");
      return;
    }

    try {
      // Delete all schedules first
      const loanSchedules = schedules[loanId] || [];
      for (const schedule of loanSchedules) {
        await deleteDoc(
          doc(db, "users", user.uid, "loans", loanId, "schedules", schedule.id)
        );
      }

      // Delete loan
      await deleteDoc(doc(db, "users", user.uid, "loans", loanId));

      toast.success("Cicilan berhasil dihapus");
    } catch (error: unknown) {
      console.error("Error deleting loan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal menghapus cicilan: ${errorMessage}`);
    }
  };

  // Setup form for editing
  const setupEditForm = (loan: Loan) => {
    setEditingLoan(loan);
    setName(loan.name);
    setDueDay(loan.dueDay.toString());
    setLoanType(loan.type);
    setTotalAmount(loan.totalAmount.toString());
    setFormattedTotalAmount(loan.totalAmount.toLocaleString("id-ID"));
    setInterestRate(loan.interestRate?.toString() || "");
    setLender(loan.lender || "");
    setAccountNumber(loan.accountNumber || "");
    setNotes(loan.notes || "");
    setStartDate(loan.startDate.toDate().toISOString().split("T")[0]);
    setEndDate(loan.endDate?.toDate().toISOString().split("T")[0] || "");
    setOpenForm(true);
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setDueDay("25");
    setLoanType("personal");
    setTotalAmount("");
    setFormattedTotalAmount("");
    setInterestRate("");
    setLender("");
    setAccountNumber("");
    setNotes("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0]
    );
    setScheduleCount("12");
    setEditingLoan(null);
  };

  // Export to Excel
  // Export to Excel
  const handleExportExcel = () => {
    try {
      const worksheetData = filteredLoans.map((loan) => {
        const typeInfo = getLoanTypeInfo(loan.type);
        const loanSchedules = schedules[loan.id] || [];

        return {
          "Nama Cicilan": loan.name,
          Tipe: typeInfo.label,
          "Pemberi Pinjaman": loan.lender || "-",
          "No. Akun": loan.accountNumber || "-",
          "Total Pinjaman": loan.totalAmount,
          "Total Terbayar": loan.paidAmount,
          "Sisa Hutang": loan.remainingAmount,
          "Format Total": `Rp ${loan.totalAmount.toLocaleString("id-ID")}`,
          "Format Terbayar": `Rp ${loan.paidAmount.toLocaleString("id-ID")}`,
          "Format Sisa": `Rp ${loan.remainingAmount.toLocaleString("id-ID")}`,
          "Bunga (%)": loan.interestRate || 0,
          "Tanggal Jatuh Tempo": `Setiap tanggal ${loan.dueDay}`,
          "Tanggal Mulai": loan.startDate.toDate().toLocaleDateString("id-ID"),
          "Tanggal Berakhir":
            loan.endDate?.toDate().toLocaleDateString("id-ID") || "-",
          Status:
            loan.status === "active"
              ? "Aktif"
              : loan.status === "paid"
              ? "Lunas"
              : "Terlambat",
          Catatan: loan.notes || "-",
          "Jumlah Jadwal": loanSchedules.length,
          "Jadwal Terbayar": loanSchedules.filter((s) => s.paid).length,
          Dibuat: loan.createdAt.toDate().toLocaleDateString("id-ID"),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cicilan");

      // Auto-size columns
      const maxWidth = worksheetData.reduce(
        (w, r) => Math.max(w, r["Nama Cicilan"].length),
        10
      );
      worksheet["!cols"] = [
        { wch: maxWidth },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 30 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];

      XLSX.writeFile(
        workbook,
        `cicilan-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Data cicilan berhasil diekspor ke Excel");
    } catch (error: unknown) {
      console.error("Error exporting to Excel:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal export data: ${errorMessage}`);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
    toast.success("Data diperbarui");
  };

  // Render schedule item dengan edit functionality
  const renderScheduleItem = (loan: Loan, schedule: Schedule) => {
    const isEditing = editingSchedule?.scheduleId === schedule.id;

    return (
      <div
        key={schedule.id}
        className={`rounded-lg border p-2 sm:p-3 ${
          schedule.paid
            ? "border-emerald-200 bg-emerald-50"
            : schedule.status === "overdue"
            ? "border-red-200 bg-red-50"
            : "border-blue-100 bg-blue-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-medium text-slate-800">
              {schedule.month}
            </p>
            <p className="text-xs text-slate-600">
              Jatuh tempo:{" "}
              {schedule.dueDate.toDate().toLocaleDateString("id-ID")}
            </p>
            {schedule.paid && schedule.paidAt && (
              <p className="text-xs text-slate-500">
                Dibayar: {schedule.paidAt.toDate().toLocaleDateString("id-ID")}
              </p>
            )}
          </div>

          <div className="text-right">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Rp
                  </div>
                  <input
                    type="number"
                    value={editScheduleAmount}
                    onChange={(e) => setEditScheduleAmount(e.target.value)}
                    className="w-32 rounded border border-blue-300 py-1 pl-7 pr-8 text-sm"
                    min="0"
                    step="1000"
                  />
                </div>
                <button
                  onClick={saveEditSchedule}
                  className="p-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEditSchedule}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Rp {schedule.amount.toLocaleString("id-ID")}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {schedule.paid ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={10} />
                      Lunas
                    </span>
                  ) : schedule.status === "overdue" ? (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Terlambat
                    </span>
                  ) : (
                    <button
                      onClick={() => markSchedulePaid(loan.id, schedule.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <CheckCircle size={10} />
                      Tandai Lunas
                    </button>
                  )}

                  {/* Tombol edit nominal */}
                  {!schedule.paid && (
                    <button
                      onClick={() =>
                        startEditSchedule(
                          loan.id,
                          schedule.id,
                          schedule.amount,
                          schedule.principal,
                          schedule.interest
                        )
                      }
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      title="Edit nominal"
                    >
                      <Edit2 size={10} />
                    </button>
                  )}
                </div>

                {/* Detail breakdown */}
                <div className="mt-1 text-xs text-slate-500">
                  Pokok: Rp {schedule.principal.toLocaleString("id-ID")}
                  {schedule.interest > 0 &&
                    ` | Bunga: Rp ${schedule.interest.toLocaleString("id-ID")}`}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
            Loans / Cicilan
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
            Kelola semua cicilan dan pinjaman dengan jadwal fleksibel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showAmounts ? (
              <EyeOff size={14} className="sm:w-4 sm:h-4" />
            ) : (
              <Eye size={14} className="sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">
              {showAmounts ? "Sembunyikan" : "Tampilkan"}
            </span>
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
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Loan</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Total Pinjaman Aktif
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showAmounts
                  ? `Rp ${loanStats.totalRemaining.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {loanStats.totalActiveLoans} pinjaman aktif
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Total Dibayar
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showAmounts
                  ? `Rp ${loanStats.totalPaid.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {(
              (loanStats.totalPaid /
                (loanStats.totalPaid + loanStats.totalRemaining)) *
                100 || 0
            ).toFixed(1)}
            % terbayar
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Cicilan Bulan Ini
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {showAmounts
                  ? `Rp ${loanStats.totalThisMonth.toLocaleString("id-ID")}`
                  : "******"}
              </p>
            </div>
            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {loanStats.upcomingPayments} pembayaran mendatang
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                Terlambat Bayar
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold">
                {overdueSchedules.length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
            {loanStats.overdueLoans} pinjaman terlambat
          </p>
        </div>
      </div>

      {/* ALERTS */}
      {(overdueSchedules.length > 0 || upcomingSchedules.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {overdueSchedules.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <h3 className="text-sm sm:text-base font-semibold text-red-800">
                  Pembayaran Terlambat
                </h3>
              </div>
              <div className="space-y-2">
                {overdueSchedules.slice(0, 3).map(({ loan, schedule }) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-100"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800">
                        {loan.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        Jatuh tempo:{" "}
                        {schedule.dueDate.toDate().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-red-600">
                        Rp {schedule.amount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-red-500">Terlambat</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingSchedules.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-semibold text-blue-800">
                  Pembayaran Mendatang
                </h3>
              </div>
              <div className="space-y-2">
                {upcomingSchedules.slice(0, 3).map(({ loan, schedule }) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800">
                        {loan.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        Jatuh tempo:{" "}
                        {schedule.dueDate.toDate().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-blue-600">
                        Rp {schedule.amount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-blue-500">
                        {Math.ceil(
                          (schedule.dueDate.toDate().getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        hari lagi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="rounded-xl border border-blue-100 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari cicilan berdasarkan nama, pemberi pinjaman, atau nomor akun..."
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
                <option value="active">Aktif</option>
                <option value="paid">Lunas</option>
                <option value="overdue">Terlambat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tipe Pinjaman
              </label>
              <select
                className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Semua Tipe</option>
                <option value="personal">Personal</option>
                <option value="mortgage">Mortgage</option>
                <option value="vehicle">Kendaraan</option>
                <option value="education">Pendidikan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Ringkasan
              </label>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Aktif: {loanStats.totalActiveLoans}
                </span>
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                  Lunas: {loans.filter((l) => l.status === "paid").length}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                  Terlambat: {loanStats.overdueLoans}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {(openForm || editingLoan) && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 shadow-lg max-w-full">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              {editingLoan ? "Edit Cicilan" : "Tambah Cicilan Baru"}
            </h3>
            <button
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500"
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

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
                  Nama Cicilan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KPR Rumah, Pinjaman Kendaraan, dll"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                  Total Pinjaman *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                    Rp
                  </div>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-lg border border-blue-200 bg-white py-1.5 sm:py-2 pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formattedTotalAmount}
                    onChange={(e) =>
                      formatCurrency(
                        e.target.value,
                        setTotalAmount,
                        setFormattedTotalAmount
                      )
                    }
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Format: 1.000.000</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    Tanggal Jatuh Tempo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="25"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">Setiap bulan</p>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                    Bunga (%)
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500">
                      %
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm pr-8 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <CalendarDays size={12} className="sm:w-3.5 sm:h-3.5" />
                  Jumlah Bulan
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  placeholder="12"
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={scheduleCount}
                  onChange={(e) => setScheduleCount(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Durasi cicilan dalam bulan
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <Target size={12} className="sm:w-3.5 sm:h-3.5" />
                  Tipe Pinjaman
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { value: "personal", label: "Personal", icon: "👤" },
                      { value: "mortgage", label: "Mortgage", icon: "🏠" },
                      { value: "vehicle", label: "Kendaraan", icon: "🚗" },
                      { value: "education", label: "Pendidikan", icon: "🎓" },
                      { value: "other", label: "Lainnya", icon: "📝" },
                    ] as const
                  ).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setLoanType(type.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-all ${
                        loanType === type.value
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-blue-100 hover:bg-blue-50"
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <Wallet size={12} className="sm:w-3.5 sm:h-3.5" />
                  Informasi Pemberi Pinjaman
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nama bank / lembaga keuangan"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={lender}
                    onChange={(e) => setLender(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nomor akun / kontrak"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
                  Catatan (Opsional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-blue-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tambahkan catatan tentang pinjaman ini..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* PREVIEW SCHEDULES */}
          {!editingLoan && totalAmount && scheduleCount && (
            <div className="mt-4 sm:mt-6 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <h4 className="mb-2 text-sm font-medium text-blue-800">
                Preview Jadwal Cicilan
              </h4>
              <div className="max-h-40 overflow-y-auto">
                {generateSchedules().map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1 text-xs"
                  >
                    <span className="text-slate-700">
                      {schedule.month} (Jatuh tempo:{" "}
                      {new Date(schedule.dueDate.toDate()).toLocaleDateString(
                        "id-ID"
                      )}
                      )
                    </span>
                    <span className="font-medium text-slate-800">
                      Rp {schedule.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-blue-600">
                Total: Rp{" "}
                {generateSchedules()
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString("id-ID")}
                {interestRate && ` (Bunga: ${interestRate}%)`}
              </p>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={editingLoan ? handleEditLoan : handleAddLoan}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {editingLoan ? "Update Cicilan" : "Simpan Cicilan"}
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

      {/* MODAL EDIT SEMUA SCHEDULES */}
      {editAllSchedulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Edit Semua Jadwal Cicilan
              </h3>
              <button
                onClick={() => setEditAllSchedulesModal(null)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="py-2 text-left text-xs font-medium text-slate-600">
                      Bulan
                    </th>
                    <th className="py-2 text-left text-xs font-medium text-slate-600">
                      Status
                    </th>
                    <th className="py-2 text-left text-xs font-medium text-slate-600">
                      Nominal (Rp)
                    </th>
                    <th className="py-2 text-left text-xs font-medium text-slate-600">
                      Pokok
                    </th>
                    <th className="py-2 text-left text-xs font-medium text-slate-600">
                      Bunga
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editAllSchedulesModal.schedules.map((schedule, index) => {
                    const originalSchedule = schedules[
                      editAllSchedulesModal.loanId
                    ]?.find((s) => s.id === schedule.id);
                    return (
                      <tr key={schedule.id} className="border-b">
                        <td className="py-2 text-xs">
                          {originalSchedule?.month || `Schedule ${index + 1}`}
                        </td>
                        <td className="py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                              schedule.paid
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {schedule.paid ? "Lunas" : "Belum"}
                          </span>
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={schedule.amount}
                            onChange={(e) =>
                              updateAllScheduleAmount(index, e.target.value)
                            }
                            className="w-32 rounded border px-2 py-1 text-sm"
                            min="0"
                          />
                        </td>
                        <td className="py-2 text-xs">
                          Rp {schedule.principal.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 text-xs">
                          Rp {schedule.interest.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditAllSchedulesModal(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={saveAllSchedules}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Simpan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT SEMUA SCHEDULES */}
      {showAllSchedulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Semua Jadwal Cicilan
              </h3>
              <button
                onClick={() => setShowAllSchedulesModal(null)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {schedules[showAllSchedulesModal]?.map((schedule) => {
                const loan = loans.find((l) => l.id === showAllSchedulesModal);
                return (
                  <div
                    key={schedule.id}
                    className={`rounded-lg border p-3 ${
                      schedule.paid
                        ? "border-emerald-200 bg-emerald-50"
                        : schedule.status === "overdue"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">
                        {schedule.month}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          schedule.paid
                            ? "bg-emerald-100 text-emerald-700"
                            : schedule.status === "overdue"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {schedule.paid
                          ? "Lunas"
                          : schedule.status === "overdue"
                          ? "Terlambat"
                          : "Belum"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">
                      Jatuh tempo:{" "}
                      {schedule.dueDate.toDate().toLocaleDateString("id-ID")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      Rp {schedule.amount.toLocaleString("id-ID")}
                    </p>
                    <div className="text-xs text-slate-500">
                      <div>
                        Pokok: Rp {schedule.principal.toLocaleString("id-ID")}
                      </div>
                      <div>
                        Bunga: Rp {schedule.interest.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {!schedule.paid && (
                        <>
                          <button
                            onClick={() =>
                              markSchedulePaid(
                                showAllSchedulesModal,
                                schedule.id
                              )
                            }
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Tandai Lunas
                          </button>
                          <button
                            onClick={() => {
                              setShowAllSchedulesModal(null);
                              startEditSchedule(
                                showAllSchedulesModal,
                                schedule.id,
                                schedule.amount,
                                schedule.principal,
                                schedule.interest
                              );
                            }}
                            className="text-xs text-slate-600 hover:text-slate-700"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LOANS LIST */}
      <div>
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            Semua Cicilan ({filteredLoans.length})
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Ditampilkan {currentLoans.length} dari {filteredLoans.length}{" "}
              cicilan
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600">
                Per halaman:
              </span>
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
              <div
                key={i}
                className="rounded-xl border border-blue-100 bg-white p-3 sm:p-5 animate-pulse"
              >
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
        ) : filteredLoans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 sm:p-10 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h4 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold text-slate-800">
              {searchQuery || filterStatus !== "all" || filterType !== "all"
                ? "Cicilan tidak ditemukan"
                : "Belum ada cicilan"}
            </h4>
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || filterStatus !== "all" || filterType !== "all"
                ? "Coba ubah filter atau kata kunci pencarian"
                : "Mulai dengan menambahkan cicilan pertama untuk melacak pinjaman"}
            </p>
            <button
              onClick={() => {
                setOpenForm(true);
                setSearchQuery("");
                setFilterStatus("all");
                setFilterType("all");
              }}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Plus size={14} className="inline mr-1 sm:mr-2" />
              Tambah Cicilan Pertama
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {currentLoans.map((loan) => {
                const typeInfo = getLoanTypeInfo(loan.type);
                const loanSchedules = schedules[loan.id] || [];
                const paidSchedules = loanSchedules.filter((s) => s.paid);
                const unpaidSchedules = loanSchedules.filter((s) => !s.paid);
                const progressPercentage =
                  loanSchedules.length > 0
                    ? (paidSchedules.length / loanSchedules.length) * 100
                    : 0;

                return (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      {/* Loan Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-lg sm:text-xl"
                            style={{
                              backgroundColor: `${typeInfo.color}20`,
                              color: typeInfo.color,
                            }}
                          >
                            {typeInfo.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                              <h4 className="text-base sm:text-lg font-semibold text-slate-800">
                                {loan.name}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                  loan.status === "active"
                                    ? "bg-blue-100 text-blue-700"
                                    : loan.status === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {loan.status === "active" && "Aktif"}
                                {loan.status === "paid" && "Lunas"}
                                {loan.status === "overdue" && "Terlambat"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mb-2">
                              {loan.lender && (
                                <span className="flex items-center gap-1">
                                  <Wallet size={12} />
                                  {loan.lender}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Jatuh tempo: Setiap tanggal {loan.dueDay}
                              </span>
                              {loan.interestRate && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp size={12} />
                                  Bunga: {loan.interestRate}%
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>
                                  Progress: {paidSchedules.length}/
                                  {loanSchedules.length} cicilan
                                </span>
                                <span>{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor:
                                      progressPercentage === 100
                                        ? "#10b981"
                                        : "#3b82f6",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Amount Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              <div className="rounded-lg bg-blue-50 p-2">
                                <p className="text-xs text-blue-600">Total</p>
                                <p className="text-sm font-semibold text-slate-800">
                                  {showAmounts
                                    ? `Rp ${loan.totalAmount.toLocaleString(
                                        "id-ID"
                                      )}`
                                    : "******"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-2">
                                <p className="text-xs text-emerald-600">
                                  Terbayar
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                  {showAmounts
                                    ? `Rp ${loan.paidAmount.toLocaleString(
                                        "id-ID"
                                      )}`
                                    : "******"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-amber-50 p-2">
                                <p className="text-xs text-amber-600">Sisa</p>
                                <p className="text-sm font-semibold text-slate-800">
                                  {showAmounts
                                    ? `Rp ${loan.remainingAmount.toLocaleString(
                                        "id-ID"
                                      )}`
                                    : "******"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => setupEditForm(loan)}
                          className="rounded-lg p-1.5 sm:p-2 hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit cicilan"
                        >
                          <Edit2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => openEditAllSchedules(loan.id)}
                          className="rounded-lg p-1.5 sm:p-2 hover:bg-slate-50 text-slate-600 transition-colors"
                          title="Edit semua jadwal"
                        >
                          <CalendarDays size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <ConfirmDialog
                          title="Hapus Cicilan?"
                          description="Semua data cicilan dan jadwal pembayaran akan dihapus permanen."
                          onConfirm={() => deleteLoan(loan.id)}
                          trigger={
                            <button
                              className="rounded-lg p-1.5 sm:p-2 hover:bg-red-50 text-red-600 transition-colors"
                              title="Hapus cicilan"
                            >
                              <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {/* Schedules */}
                    {loanSchedules.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-slate-700">
                            Jadwal Pembayaran
                          </h5>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowAllSchedulesModal(loan.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Lihat Semua
                            </button>
                            <button
                              onClick={() => openEditAllSchedules(loan.id)}
                              className="text-xs text-slate-600 hover:text-slate-700"
                            >
                              Edit Semua
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {loanSchedules
                            .slice(0, 3)
                            .map((schedule) =>
                              renderScheduleItem(loan, schedule)
                            )}
                          {loanSchedules.length > 3 && (
                            <div className="rounded-lg border border-dashed border-blue-200 bg-white p-3 text-center">
                              <p className="text-xs text-slate-600">
                                +{loanSchedules.length - 3} jadwal lainnya
                              </p>
                              <button
                                onClick={() =>
                                  setShowAllSchedulesModal(loan.id)
                                }
                                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                Lihat Semua
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-3 sm:mt-4 px-2 sm:px-4 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
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

      {/* QUICK TIPS */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 sm:p-5">
        <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-blue-800">
          💡 Tips Mengelola Cicilan
        </h4>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-700">
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>
              Bayar cicilan sebelum tanggal jatuh tempo untuk menghindari denda.
            </span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>
              Prioritaskan cicilan dengan bunga tertinggi untuk menghemat biaya.
            </span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>
              Gunakan fitur reminder untuk tidak melewatkan tanggal pembayaran.
            </span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>
              Pertimbangkan untuk membayar lebih awal jika memungkinkan untuk
              mengurangi total bunga.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
