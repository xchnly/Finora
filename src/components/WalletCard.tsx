// components/WalletCard.tsx
import { Edit2, Trash2 } from "lucide-react";
import { WalletType } from "../app/types/wallet";
import ConfirmDialog from "./ConfirmDialog";
import { Timestamp } from "firebase/firestore";

export type WalletCardProps = {
  wallet: {
    id: string;
    name: string;
    type: string;
    color: string;
    balance: number;
    description?: string;
    accountNumber?: string;
    createdAt: Timestamp;
  };
  walletTypes: WalletType[];
  showBalance: boolean;
  onEdit: () => void;
  onDelete: (id: string) => void;
  getWalletTypeName: (typeId: string) => string;
  className?: string;
};

export default function WalletCard({
  wallet,
  walletTypes,
  showBalance,
  onEdit,
  onDelete,
  getWalletTypeName,
  className = "",
}: WalletCardProps) {
  const walletType = walletTypes.find(t => t.id === wallet.type);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-blue-200 ${className}`}
    >
      {/* Action Buttons */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 hover:bg-blue-50 text-blue-600"
          title="Edit wallet"
          aria-label={`Edit wallet ${wallet.name}`}
        >
          <Edit2 size={14} />
        </button>
        <ConfirmDialog
          title="Hapus Wallet?"
          description="Wallet ini akan dihapus permanen. Transaksi yang terkait tidak akan terhapus."
          onConfirm={() => onDelete(wallet.id)}
          trigger={
            <button
              className="rounded-lg p-1.5 hover:bg-red-50 text-red-600"
              title="Hapus wallet"
              aria-label={`Delete wallet ${wallet.name}`}
            >
              <Trash2 size={14} />
            </button>
          }
        />
      </div>

      {/* Wallet Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: wallet.color }}
          aria-label={`${wallet.name} wallet type`}
        >
          {walletType?.icon || <div className="text-lg">💼</div>}
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

      {/* Balance Section */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Saldo
        </p>
        <p 
          className="mt-1 text-2xl font-bold text-slate-800"
          aria-label={`Saldo wallet ${wallet.name}`}
        >
          {showBalance ? `Rp ${wallet.balance.toLocaleString("id-ID")}` : "••••••"}
        </p>
      </div>

      {/* Description */}
      {wallet.description && (
        <div className="pt-4 border-t border-blue-50">
          <p className="text-xs text-slate-600 line-clamp-2">
            {wallet.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Dibuat{" "}
          {wallet.createdAt?.toDate
            ? wallet.createdAt.toDate().toLocaleDateString("id-ID")
            : "Baru saja"}
        </span>
        <span
          className={`px-2 py-1 rounded-full font-medium ${
            wallet.balance >= 0
              ? "bg-blue-50 text-blue-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {wallet.balance >= 0 ? "Aktif" : "Minus"}
        </span>
      </div>
    </div>
  );
}