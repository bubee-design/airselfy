import * as Location from "expo-location";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export interface NearbyUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  lat: number;
  lon: number;
  distanceM: number;
}

const BASE_LAT = 37.7749;
const BASE_LON = -122.4194;

const SEED_USERS: NearbyUser[] = [
  { id: "seed-1", name: "Sam K.", initials: "SK", color: "#FF6B6B", lat: BASE_LAT + 0.0012, lon: BASE_LON + 0.0008, distanceM: 120 },
  { id: "seed-2", name: "Jordan M.", initials: "JM", color: "#FFB347", lat: BASE_LAT - 0.0018, lon: BASE_LON + 0.0014, distanceM: 240 },
  { id: "seed-3", name: "Taylor R.", initials: "TR", color: "#4ADEAD", lat: BASE_LAT + 0.0009, lon: BASE_LON - 0.0022, distanceM: 380 },
  { id: "seed-4", name: "Morgan P.", initials: "MP", color: "#F06EFF", lat: BASE_LAT - 0.0011, lon: BASE_LON - 0.0016, distanceM: 410 },
  { id: "seed-5", name: "Riley S.", initials: "RS", color: "#5B8DEF", lat: BASE_LAT + 0.002, lon: BASE_LON + 0.0019, distanceM: 470 },
];

function getSocketUrl(): string | undefined {
  if (Platform.OS === "web") return undefined;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : undefined;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface SocketContextType {
  nearbyUsers: NearbyUser[];
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  nearbyUsers: [],
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const ownPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const posSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      posSubRef.current?.remove();
      posSubRef.current = null;
      setIsConnected(false);
      setNearbyUsers([]);
      return;
    }

    const url = getSocketUrl();
    const socket: Socket = io(url as string, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", {
        userId: user.id,
        name: user.name,
        initials: user.initials,
      });
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    type RemoteUser = Omit<NearbyUser, "distanceM">;

    socket.on("nearby_update", (users: RemoteUser[]) => {
      setNearbyUsers(
        users.length > 0
          ? users.map((u) => ({
              ...u,
              distanceM: ownPosRef.current
                ? Math.round(haversineM(ownPosRef.current.lat, ownPosRef.current.lon, u.lat, u.lon))
                : 0,
            }))
          : []
      );
    });

    socket.on("user_moved", (moved: RemoteUser) => {
      setNearbyUsers((prev) => {
        const distanceM = ownPosRef.current
          ? Math.round(haversineM(ownPosRef.current.lat, ownPosRef.current.lon, moved.lat, moved.lon))
          : 0;
        const updated: NearbyUser = { ...moved, distanceM };
        const idx = prev.findIndex((u) => u.id === moved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    });

    socket.on("user_left", (userId: string) => {
      setNearbyUsers((prev) =>
        prev.filter((u) => u.id !== userId)
      );
    });

    // A new peer just joined — re-emit our current position immediately
    // so they can see us without waiting for the next watchPositionAsync tick
    socket.on("peer_joined", () => {
      if (ownPosRef.current) {
        socket.emit("location", {
          lat: ownPosRef.current.lat,
          lon: ownPosRef.current.lon,
        });
      }
    });

    // Start location watch
    startLocationWatch(socket);

    return () => {
      socket.disconnect();
      posSubRef.current?.remove();
      posSubRef.current = null;
    };
  }, [user?.id]);

  async function startLocationWatch(socket: Socket) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Emit a position snapshot immediately so we're visible to existing peers
      // without waiting for the first watchPositionAsync tick (movement/timer)
      try {
        const snap = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        ownPosRef.current = {
          lat: snap.coords.latitude,
          lon: snap.coords.longitude,
        };
        socket.emit("location", {
          lat: snap.coords.latitude,
          lon: snap.coords.longitude,
        });
      } catch {
        // GPS unavailable on first snapshot — watch will fill in later
      }

      posSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        (loc) => {
          ownPosRef.current = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
          };
          socket.emit("location", {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
          });
        }
      );
    } catch {
      // Location unavailable — socket still connected, just no position emitted
    }
  }

  return (
    <SocketContext.Provider value={{ nearbyUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
