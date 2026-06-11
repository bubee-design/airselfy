import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean | string>;
  signup: (name: string, email: string, password: string) => Promise<boolean | string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "@airselfy_user";

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "/api";
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

  async function signup(
    name: string,
    email: string,
    password: string
  ): Promise<boolean | string> {
    try {
      const res = await fetch(`${getApiBase()}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.status === 409) {
        return data.error ?? "An account with that email already exists.";
      }
      if (!res.ok) {
        return data.error ?? "Something went wrong. Please try again.";
      }

      const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        initials: data.initials,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch {
      return "Unable to connect. Please check your connection.";
    }
  }

  async function login(
    email: string,
    password: string
  ): Promise<boolean | string> {
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 401) {
        return data.error ?? "Invalid email or password.";
      }
      if (!res.ok) {
        return data.error ?? "Something went wrong. Please try again.";
      }

      const loggedInUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        initials: data.initials,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return true;
    } catch {
      return "Unable to connect. Please check your connection.";
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
