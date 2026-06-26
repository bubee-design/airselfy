import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

export type TransactionType = "topup" | "spend" | "earn" | "withdraw";

export type Transaction = {
  id: string;
  amount: number;
  label: string;
  date: Date;
  type: TransactionType;
};

interface WalletContextValue {
  balanceCents: number;
  earningsCents: number;
  transactions: Transaction[];
  topUpCents: (cents: number, label: string) => void;
  topUpWithStripe: (cents: number, label: string) => Promise<{ success: boolean; error?: string }>;
  deductCents: (cents: number, label: string) => boolean;
  earnCents: (cents: number, label: string) => void;
  withdrawEarnings: (cents: number, label: string) => boolean;
}

const STARTER_CENTS = 500;

const WalletContext = createContext<WalletContextValue>({
  balanceCents: 0,
  earningsCents: 0,
  transactions: [],
  topUpCents: () => {},
  topUpWithStripe: async () => ({ success: false }),
  deductCents: () => false,
  earnCents: () => {},
  withdrawEarnings: () => false,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [balanceCents, setBalanceCents] = useState(0);
  const [earningsCents, setEarningsCents] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const balanceCentsRef = useRef(0);
  balanceCentsRef.current = balanceCents;
  const earningsCentsRef = useRef(0);
  earningsCentsRef.current = earningsCents;

  const balanceKey = user ? `airselfy_balance_${user.id}` : null;
  const earningsKey = user ? `airselfy_earnings_${user.id}` : null;

  useEffect(() => {
    if (!balanceKey || !earningsKey) {
      setBalanceCents(0);
      setEarningsCents(0);
      setTransactions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [storedBalance, storedEarnings] = await Promise.all([
          AsyncStorage.getItem(balanceKey),
          AsyncStorage.getItem(earningsKey),
        ]);
        if (cancelled) return;
        if (storedBalance === null) {
          setBalanceCents(STARTER_CENTS);
          await AsyncStorage.setItem(balanceKey, String(STARTER_CENTS));
        } else {
          setBalanceCents(parseInt(storedBalance, 10));
        }
        setEarningsCents(storedEarnings !== null ? parseInt(storedEarnings, 10) : 0);
      } catch {
        if (!cancelled) setBalanceCents(STARTER_CENTS);
      }
    })();
    return () => { cancelled = true; };
  }, [balanceKey, earningsKey]);

  useEffect(() => {
    if (!balanceKey) return;
    AsyncStorage.setItem(balanceKey, String(balanceCents)).catch(() => {});
  }, [balanceCents, balanceKey]);

  useEffect(() => {
    if (!earningsKey) return;
    AsyncStorage.setItem(earningsKey, String(earningsCents)).catch(() => {});
  }, [earningsCents, earningsKey]);

  const addTx = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    setTransactions((prev) => [
      { ...tx, id: `${Date.now()}-${Math.random()}`, date: new Date() },
      ...prev,
    ]);
  }, []);

  const topUpCents = useCallback((cents: number, label: string) => {
    setBalanceCents((prev) => prev + cents);
    addTx({ amount: cents, label, type: "topup" });
  }, [addTx]);

  const topUpWithStripe = useCallback(
    async (_cents: number, _label: string): Promise<{ success: boolean; error?: string }> => {
      return { success: false, error: "Card payments are only available on the mobile app." };
    },
    []
  );

  const deductCents = useCallback((cents: number, label: string): boolean => {
    if (balanceCentsRef.current < cents) return false;
    setBalanceCents((prev) => Math.max(0, prev - cents));
    addTx({ amount: cents, label, type: "spend" });
    return true;
  }, [addTx]);

  const earnCents = useCallback((cents: number, label: string) => {
    setEarningsCents((prev) => prev + cents);
    addTx({ amount: cents, label, type: "earn" });
  }, [addTx]);

  const withdrawEarnings = useCallback((cents: number, label: string): boolean => {
    if (earningsCentsRef.current < cents) return false;
    setEarningsCents((prev) => Math.max(0, prev - cents));
    addTx({ amount: cents, label, type: "withdraw" });
    return true;
  }, [addTx]);

  return (
    <WalletContext.Provider
      value={{
        balanceCents,
        earningsCents,
        transactions,
        topUpCents,
        topUpWithStripe,
        deductCents,
        earnCents,
        withdrawEarnings,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
