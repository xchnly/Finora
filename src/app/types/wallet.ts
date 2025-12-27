// types/wallet.ts
import { Timestamp } from "firebase/firestore";
import { ReactNode } from "react";

export type Wallet = {
  id: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  createdAt: Timestamp;
  description?: string;
  accountNumber?: string;
};

export type WalletType = {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
};