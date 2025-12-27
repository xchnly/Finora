import { toast } from "sonner";

export function triggerLoanReminder({
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
}) {
  const today = new Date();
  const todayDate = today.getDate();
  const currentMonth = today.toISOString().slice(0, 7);

  if (month !== currentMonth) return;

  const daysLeft = dueDay - todayDate;
  if (![7, 3, 1, 0].includes(daysLeft)) return;

  const key = `loan_reminder_${loanId}_${month}_${daysLeft}`;
  if (localStorage.getItem(key)) return;

  if (daysLeft === 7) {
    toast.warning(
      `Cicilan "${loanName}" jatuh tempo 7 hari lagi (Rp ${amount.toLocaleString("id-ID")})`
    );
  } else if (daysLeft === 3) {
    toast(
      `⚠️ Cicilan "${loanName}" tinggal 3 hari lagi (Rp ${amount.toLocaleString("id-ID")})`
    );
  } else {
    toast.error(
      `🚨 Cicilan "${loanName}" JATUH TEMPO ${daysLeft === 0 ? "HARI INI" : "BESOK"}! (Rp ${amount.toLocaleString("id-ID")})`
    );
  }

  localStorage.setItem(key, "1");
}
