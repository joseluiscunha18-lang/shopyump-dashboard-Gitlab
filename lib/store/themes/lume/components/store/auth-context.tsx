'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type OrderStatus = "pendente" | "processamento" | "concluido";

export type Order = {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: { name: string; quantity: number }[];
};

export type Delivery = {
  name: string;
  phone: string;
  address: string;
};

export type Account = {
  email: string;
  name: string;
  marketingOptIn: boolean;
  orders: Order[];
  delivery: Delivery | null;
  restockAlerts?: string[];
};

type AuthValue = {
  account: Account | null;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  pendingEmail: string | null;
  lastCode: string | null;
  requestCode: (email: string, marketingOptIn: boolean) => string;
  verifyCode: (code: string) => boolean;
  resetFlow: () => void;
  updateAccount: (patch: Partial<Pick<Account, "name" | "marketingOptIn" | "delivery">>) => void;
  saveDelivery: (delivery: Delivery) => void;
  addOrder: (order: Omit<Order, "id" | "date" | "status"> & Partial<Pick<Order, "status">>) => void;
  restockAlerts: string[];
  requestRestockAlert: (productId: string) => "registered" | "auth-required";
  logout: () => void;
};

const STORAGE_KEY = "lume.account";

const AuthContext = createContext<AuthValue | undefined>(undefined);

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const orderStatusLabel: Record<OrderStatus, string> = {
  pendente: "Pendente",
  processamento: "Em processamento",
  concluido: "Concluído",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingOptIn, setPendingOptIn] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [pendingRestock, setPendingRestock] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Account;
        setAccount({ ...parsed, orders: parsed.orders ?? [], delivery: parsed.delivery ?? null, restockAlerts: parsed.restockAlerts ?? [] });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: Account | null) => {
    setAccount(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const requestCode = (email: string, marketingOptIn: boolean) => {
    const code = generateCode();
    setPendingEmail(email);
    setPendingOptIn(marketingOptIn);
    setLastCode(code);
    return code;
  };

  const verifyCode = (code: string) => {
    if (!pendingEmail || code !== lastCode) return false;
    const name = (pendingEmail.split("@")[0] ?? "").replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    persist({
      email: pendingEmail,
      name,
      marketingOptIn: pendingOptIn,
      orders: [],
      delivery: null,
      restockAlerts: pendingRestock ? [pendingRestock] : [],
    });
    setPendingRestock(null);
    setPendingEmail(null);
    setLastCode(null);
    setAuthOpen(false);
    return true;
  };

  const resetFlow = () => {
    setPendingEmail(null);
    setLastCode(null);
  };

  const updateAccount = (patch: Partial<Pick<Account, "name" | "marketingOptIn" | "delivery">>) => {
    if (!account) return;
    persist({ ...account, ...patch });
  };

  const saveDelivery = (delivery: Delivery) => {
    if (!account) return;
    persist({ ...account, delivery });
  };

  const addOrder: AuthValue["addOrder"] = (order) => {
    if (!account) return;
    const next: Order = {
      id: `LUME-${Math.floor(10000 + Math.random() * 89999)}`,
      date: new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }),
      status: order.status ?? "pendente",
      total: order.total,
      items: order.items,
    };
    persist({ ...account, orders: [next, ...account.orders] });
  };

  const requestRestockAlert: AuthValue["requestRestockAlert"] = (productId) => {
    if (!account) {
      setPendingRestock(productId);
      setAuthOpen(true);
      return "auth-required";
    }
    const current = account.restockAlerts ?? [];
    if (!current.includes(productId)) persist({ ...account, restockAlerts: [...current, productId] });
    return "registered";
  };

  const logout = () => {
    persist(null);
    resetFlow();
  };

  const value = useMemo<AuthValue>(
    () => ({ account, authOpen, setAuthOpen, pendingEmail, lastCode, requestCode, verifyCode, resetFlow, updateAccount, saveDelivery, addOrder, restockAlerts: account?.restockAlerts ?? [], requestRestockAlert, logout }),
    [account, authOpen, pendingEmail, lastCode, pendingOptIn, pendingRestock],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export const getInitials = (name: string, email: string) => {
  const source = name?.trim() || email;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || source.slice(0, 2).toUpperCase();
};
