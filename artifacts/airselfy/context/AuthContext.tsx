import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "@airselfy_user";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setUser(JSON.parse(stored));
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, _password: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved: User = JSON.parse(stored);
        if (saved.email.toLowerCase() === email.toLowerCase()) {
          setUser(saved);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async function signup(
    name: string,
    email: string,
    _password: string
  ): Promise<boolean> {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      initials: getInitials(name),
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
