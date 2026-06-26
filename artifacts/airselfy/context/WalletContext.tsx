import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { stripeReady } from "@/components/StripeWrapper";
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

const STARTER_CENTS = 500; // $5.00 free credit for every new account

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "/api";
}

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
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [balanceCents, setBalanceCents] = useState(0);
  const [earningsCents, setEarningsCents] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const balanceCentsRef = useRef(0);
  balanceCentsRef.current = balanceCents;
  const earningsCentsRef = useRef(0);
  earningsCentsRef.current = earningsCents;

  const balanceKey = user ? `airselfy_balance_${user.id}` : null;
  const earningsKey = user ? `airselfy_earnings_${user.id}` : null;

  // ── Load from storage whenever the logged-in user changes ──────────────────
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

    return () => {
      cancelled = true;
    };
  }, [balanceKey, earningsKey]);

  // ── Persist balance whenever it changes ────────────────────────────────────
  useEffect(() => {
    if (!balanceKey) return;
    AsyncStorage.setItem(balanceKey, String(balanceCents)).catch(() => {});
  }, [balanceCents, balanceKey]);

  useEffect(() => {
    if (!earningsKey) return;
    AsyncStorage.setItem(earningsKey, String(earningsCents)).catch(() => {});
  }, [earningsCents, earningsKey]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addTx = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    setTransactions((prev) => [
      { ...tx, id: `${Date.now()}-${Math.random()}`, date: new Date() },
      ...prev,
    ]);
  }, []);

  const topUpCents = useCallback(
    (cents: number, label: string) => {
      setBalanceCents((prev) => prev + cents);
      addTx({ amount: cents, label, type: "topup" });
    },
    [addTx]
  );

  const topUpWithStripe = useCallback(
    async (cents: number, label: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "Not logged in" };

      try {
        // 0. Ensure StripeProvider has been given a real publishable key before proceeding
        await stripeReady;

        // 1. Create a PaymentIntent on the server
        const response = await fetch(`${getApiBase()}/stripe/payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: String(user.id), amountCents: cents }),
        });

        if (!response.ok) {
          const err = await response.json() as { error?: string };
          return { success: false, error: err.error ?? "Failed to create payment" };
        }

        const { clientSecret } = await response.json() as { clientSecret: string };

        // 2. Initialize the payment sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: "Airselfy",
          returnURL: "airselfy://stripe-return",
        });

        if (initError) {
          return { success: false, error: initError.message };
        }

        // 3. Present the native payment sheet
        const { error: payError } = await presentPaymentSheet();

        if (payError) {
          if (payError.code === "Canceled") {
            return { success: false, error: "canceled" };
          }
          return { success: false, error: payError.message };
        }

        // 4. Payment succeeded — credit the local wallet
        topUpCents(cents, label);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? "Payment failed" };
      }
    },
    [user, initPaymentSheet, presentPaymentSheet, topUpCents]
  );

  const deductCents = useCallback(
    (cents: number, label: string): boolean => {
      if (balanceCentsRef.current < cents) return false;
      setBalanceCents((prev) => Math.max(0, prev - cents));
      addTx({ amount: cents, label, type: "spend" });
      return true;
    },
    [addTx]
  );

  const earnCents = useCallback(
    (cents: number, label: string) => {
      setEarningsCents((prev) => prev + cents);
      addTx({ amount: cents, label, type: "earn" });
    },
    [addTx]
  );

  const withdrawEarnings = useCallback(
    (cents: number, label: string): boolean => {
      if (earningsCentsRef.current < cents) return false;
      setEarningsCents((prev) => Math.max(0, prev - cents));
      addTx({ amount: cents, label, type: "withdraw" });
      return true;
    },
    [addTx]
  );

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
