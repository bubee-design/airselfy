import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
}

const ALBUM_KEY = "@airselfy_album";
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const albumRef = useRef<AlbumItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(ALBUM_KEY).then((stored) => {
      if (stored) {
        const parsed: AlbumItem[] = JSON.parse(stored);
        setAlbumItems(parsed);
        albumRef.current = parsed;
      }
    });
  }, []);

  async function addAlbumItem(
    item: Omit<AlbumItem, "id" | "createdAt">
  ): Promise<void> {
    const newItem: AlbumItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      createdAt: Date.now(),
    };
    const updated = [newItem, ...albumRef.current];
    albumRef.current = updated;
    setAlbumItems(updated);
    try {
      await AsyncStorage.setItem(ALBUM_KEY, JSON.stringify(updated));
    } catch {}
  }

  return (
    <AppContext.Provider value={{ albumItems, addAlbumItem }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
