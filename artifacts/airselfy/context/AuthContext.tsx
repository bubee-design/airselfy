import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface StudentProfile {
  fullName: string;
  email: string;
  gender: string;
  degree: string;
  university: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  userType?: string | null;
  studentProfile?: StudentProfile | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<boolean | string>;
  signup: (name: string, email: string, password: string) => Promise<boolean | string>;
  logout: () => Promise<void>;
  setUserType: (
    userType: "regular" | "student",
    studentProfile?: StudentProfile
  ) => Promise<boolean | string>;
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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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
        userType: data.userType ?? null,
        studentProfile: data.studentProfile ?? null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setNeedsOnboarding(true);
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
        userType: data.userType ?? null,
        studentProfile: data.studentProfile ?? null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setNeedsOnboarding(true);
      return true;
    } catch {
      return "Unable to connect. Please check your connection.";
    }
  }

  async function setUserType(
    userType: "regular" | "student",
    studentProfile?: StudentProfile
  ): Promise<boolean | string> {
    if (!user) return "Not logged in.";
    try {
      const res = await fetch(`${getApiBase()}/user/type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userType,
          ...(studentProfile ? { studentProfile } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return data.error ?? "Something went wrong. Please try again.";
      }

      const updatedUser: User = {
        ...user,
        userType: data.userType ?? userType,
        studentProfile: data.studentProfile ?? studentProfile ?? null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setNeedsOnboarding(false);
      return true;
    } catch {
      return "Unable to connect. Please check your connection.";
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setNeedsOnboarding(false);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, needsOnboarding, login, signup, logout, setUserType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
