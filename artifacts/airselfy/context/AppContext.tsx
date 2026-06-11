import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";

export interface AlbumItem {
  id: string;
  type: "photo" | "video";
  byName: string;
  uri: string;
  createdAt: number;
  duration?: number;
}

interface AppContextType {
  albumItems: AlbumItem[];
  addAlbumItem: (item: Omit<AlbumItem, "id" | "createdAt">) => Promise<void>;
  deleteAlbumItem: (id: string) => Promise<void>;
  albumLoading: boolean;
}

const ALBUM_KEY = "@airselfy_album";
const AppContext = createContext<AppContextType | null>(null);

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "/api";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const albumRef = useRef<AlbumItem[]>([]);

  // Load from DB when user logs in; fall back to local cache while offline
  useEffect(() => {
    if (!user) {
      setAlbumItems([]);
      albumRef.current = [];
      return;
    }

    setAlbumLoading(true);

    // Try to seed from local cache immediately so the UI isn't blank
    AsyncStorage.getItem(ALBUM_KEY).then((stored) => {
      if (stored) {
        const cached: AlbumItem[] = JSON.parse(stored);
        if (albumRef.current.length === 0) {
          albumRef.current = cached;
          setAlbumItems(cached);
        }
      }
    }).catch(() => {});

    // Fetch authoritative list from server
    fetch(`${getApiBase()}/media?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: AlbumItem[]) => {
        albumRef.current = data;
        setAlbumItems(data);
        AsyncStorage.setItem(ALBUM_KEY, JSON.stringify(data)).catch(() => {});
      })
      .catch(() => {
        // Server unreachable — already showing local cache
      })
      .finally(() => setAlbumLoading(false));
  }, [user?.id]);

  async function addAlbumItem(
    item: Omit<AlbumItem, "id" | "createdAt">
  ): Promise<void> {
    // Optimistic local insert
    const localItem: AlbumItem = {
      ...item,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    const optimistic = [localItem, ...albumRef.current];
    albumRef.current = optimistic;
    setAlbumItems(optimistic);

    if (!user) return;

    try {
      const res = await fetch(`${getApiBase()}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: item.type,
          byName: item.byName,
          uri: item.uri,
          ...(item.duration != null ? { duration: item.duration } : {}),
        }),
      });

      if (res.ok) {
        const saved: AlbumItem = await res.json();
        // Replace the optimistic item with the real DB id
        const updated = albumRef.current.map((a) =>
          a.id === localItem.id ? saved : a
        );
        albumRef.current = updated;
        setAlbumItems(updated);
        AsyncStorage.setItem(ALBUM_KEY, JSON.stringify(updated)).catch(() => {});
      }
    } catch {
      // Network error — keep optimistic item; sync on next open
      AsyncStorage.setItem(ALBUM_KEY, JSON.stringify(albumRef.current)).catch(() => {});
    }
  }

  async function deleteAlbumItem(id: string): Promise<void> {
    const updated = albumRef.current.filter((a) => a.id !== id);
    albumRef.current = updated;
    setAlbumItems(updated);
    AsyncStorage.setItem(ALBUM_KEY, JSON.stringify(updated)).catch(() => {});

    if (id.startsWith("local-")) return; // Not yet persisted

    try {
      await fetch(`${getApiBase()}/media/${id}`, { method: "DELETE" });
    } catch {}
  }

  return (
    <AppContext.Provider value={{ albumItems, addAlbumItem, deleteAlbumItem, albumLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
