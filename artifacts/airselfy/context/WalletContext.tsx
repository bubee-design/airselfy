import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:5000";

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletContextType {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: WalletTransaction[];
  loading: boolean;
  topUp: (amount: number) => Promise<void>;
  addTransaction: (type: string, amount: number, description: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const STORAGE_KEY = "@airselfy_wallet";
const WELCOME_DONE_KEY = "@airselfy_wallet_welcomed";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  async function ensureWelcomeCredits(uid: string) {
    const key = `${WELCOME_DONE_KEY}_${uid}`;
    const done = await AsyncStorage.getItem(key);
    if (done) return;
    try {
      await fetch(`${BASE_URL}/api/wallet/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          type: "topup",
          amount: 100,
          description: "Welcome Credits",
        }),
      });
      await AsyncStorage.setItem(key, "1");
    } catch {
      // silently ignore
    }
  }

  async function fetchWallet(uid: string) {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/wallet?userId=${uid}`);
      if (!res.ok) throw new Error("wallet fetch failed");
      const data = await res.json() as {
        balance: number;
        totalEarned: number;
        totalSpent: number;
        transactions: WalletTransaction[];
      };
      setBalance(data.balance);
      setTotalEarned(data.totalEarned);
      setTotalSpent(data.totalSpent);
      setTransactions(data.transactions);
      await AsyncStorage.setItem(STORAGE_KEY + "_" + uid, JSON.stringify(data));
    } catch {
      const cached = await AsyncStorage.getItem(STORAGE_KEY + "_" + uid);
      if (cached) {
        const data = JSON.parse(cached) as {
          balance: number;
          totalEarned: number;
          totalSpent: number;
          transactions: WalletTransaction[];
        };
        setBalance(data.balance);
        setTotalEarned(data.totalEarned);
        setTotalSpent(data.totalSpent);
        setTransactions(data.transactions);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    const uid = String(user.id);
    ensureWelcomeCredits(uid).then(() => fetchWallet(uid));
  }, [user?.id]);

  async function topUp(amount: number) {
    if (!user?.id) return;
    const res = await fetch(`${BASE_URL}/api/wallet/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, amount }),
    });
    if (!res.ok) throw new Error("Top-up failed");
    await fetchWallet(String(user.id));
  }

  async function addTransaction(type: string, amount: number, description: string) {
    if (!user?.id) return;
    const res = await fetch(`${BASE_URL}/api/wallet/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, type, amount, description }),
    });
    if (!res.ok) throw new Error("Transaction failed");
    await fetchWallet(String(user.id));
  }

  async function refresh() {
    if (!user?.id) return;
    await fetchWallet(String(user.id));
  }

  return (
    <WalletContext.Provider
      value={{ balance, totalEarned, totalSpent, transactions, loading, topUp, addTransaction, refresh }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
