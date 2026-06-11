import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface NearbyUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  latOffset: number;
  lonOffset: number;
  distanceM: number;
}

export interface AlbumItem {
  id: string;
  type: "photo" | "video";
  byName: string;
  uri: string;
  createdAt: number;
  duration?: number;
}

interface AppContextType {
  nearbyUsers: NearbyUser[];
  albumItems: AlbumItem[];
  addAlbumItem: (item: Omit<AlbumItem, "id" | "createdAt">) => Promise<void>;
}

const SEED_USERS: NearbyUser[] = [
  {
    id: "1",
    name: "Sam K.",
    initials: "SK",
    color: "#FF6B6B",
    latOffset: 0.0012,
    lonOffset: 0.0008,
    distanceM: 120,
  },
  {
    id: "2",
    name: "Jordan M.",
    initials: "JM",
    color: "#FFB347",
    latOffset: -0.0018,
    lonOffset: 0.0014,
    distanceM: 240,
  },
  {
    id: "3",
    name: "Taylor R.",
    initials: "TR",
    color: "#4ADEAD",
    latOffset: 0.0009,
    lonOffset: -0.0022,
    distanceM: 380,
  },
  {
    id: "4",
    name: "Morgan P.",
    initials: "MP",
    color: "#F06EFF",
    latOffset: -0.0011,
    lonOffset: -0.0016,
    distanceM: 410,
  },
  {
    id: "5",
    name: "Riley S.",
    initials: "RS",
    color: "#5B8DEF",
    latOffset: 0.002,
    lonOffset: 0.0019,
    distanceM: 470,
  },
];

const ALBUM_KEY = "@airselfy_album";
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>(SEED_USERS);
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const albumRef = useRef<AlbumItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(ALBUM_KEY).then((stored) => {
      if (stored) {
        const parsed: AlbumItem[] = JSON.parse(stored);
        setAlbumItems(parsed);
        albumRef.current = parsed;
      }
    });

    intervalRef.current = setInterval(() => {
      setNearbyUsers((prev) =>
        prev.map((u) => ({
          ...u,
          latOffset: u.latOffset + (Math.random() - 0.5) * 0.0003,
          lonOffset: u.lonOffset + (Math.random() - 0.5) * 0.0003,
          distanceM: Math.max(
            30,
            u.distanceM + Math.floor((Math.random() - 0.5) * 30)
          ),
        }))
      );
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
    <AppContext.Provider value={{ nearbyUsers, albumItems, addAlbumItem }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
