import * as Location from "expo-location";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useApp } from "./AppContext";

export interface NearbyUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  lat: number;
  lon: number;
  distanceM: number;
}

export interface IncomingRequest {
  requesterId: string;
  requesterName: string;
  requesterLat: number;
  requesterLon: number;
  type: "photo" | "video";
  duration: number;
}

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
  pendingRequest: IncomingRequest | null;
  lastReceivedAt: number | null;
  requestDeclinedBy: string | null;
  sendRequest: (targetUserId: string, type: "photo" | "video", duration: number) => void;
  acceptRequest: () => void;
  declineRequest: () => void;
  deliverMedia: (requesterId: string, type: "photo" | "video", duration: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  nearbyUsers: [],
  isConnected: false,
  pendingRequest: null,
  lastReceivedAt: null,
  requestDeclinedBy: null,
  sendRequest: () => {},
  acceptRequest: () => {},
  declineRequest: () => {},
  deliverMedia: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addAlbumItem } = useApp();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<IncomingRequest | null>(null);
  const [lastReceivedAt, setLastReceivedAt] = useState<number | null>(null);
  const [requestDeclinedBy, setRequestDeclinedBy] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const ownPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const posSubRef = useRef<Location.LocationSubscription | null>(null);
  // Keep addAlbumItem in a ref so socket handlers never go stale
  const addAlbumItemRef = useRef(addAlbumItem);
  useEffect(() => { addAlbumItemRef.current = addAlbumItem; }, [addAlbumItem]);

  // ── Context-exposed actions ──────────────────────────────────────────────

  function sendRequest(targetUserId: string, type: "photo" | "video", duration: number) {
    if (!user || !socketRef.current) return;
    socketRef.current.emit("photo_request", {
      targetUserId,
      type,
      duration,
      requesterId: user.id,
      requesterName: user.name,
      requesterLat: ownPosRef.current?.lat ?? 0,
      requesterLon: ownPosRef.current?.lon ?? 0,
    });
  }

  function acceptRequest() {
    const req = pendingRequest;
    if (!req) return;
    setPendingRequest(null);
    router.push({
      pathname: "/compass",
      params: {
        userId: req.requesterId,
        userName: req.requesterName,
        type: req.type,
        duration: String(req.duration),
        targetLat: String(req.requesterLat),
        targetLon: String(req.requesterLon),
        requesterId: req.requesterId,
      },
    });
  }

  function declineRequest() {
    if (pendingRequest) {
      socketRef.current?.emit("photo_declined", { requesterId: pendingRequest.requesterId });
    }
    setPendingRequest(null);
  }

  function deliverMedia(requesterId: string, type: "photo" | "video", duration: number) {
    socketRef.current?.emit("photo_delivered", { requesterId, type, duration });
  }

  // ── Socket lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      posSubRef.current?.remove();
      posSubRef.current = null;
      setIsConnected(false);
      setNearbyUsers([]);
      setPendingRequest(null);
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
      if (ownPosRef.current) {
        socket.emit("location", {
          lat: ownPosRef.current.lat,
          lon: ownPosRef.current.lon,
        });
      }
    });

    socket.on("connect_error", () => setIsConnected(false));
    socket.on("disconnect", () => setIsConnected(false));

    type RemoteUser = Omit<NearbyUser, "distanceM">;

    socket.on("nearby_update", (users: RemoteUser[]) => {
      setNearbyUsers(
        users.map((u) => ({
          ...u,
          distanceM: ownPosRef.current
            ? Math.round(haversineM(ownPosRef.current.lat, ownPosRef.current.lon, u.lat, u.lon))
            : 0,
        }))
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
      setNearbyUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socket.on("peer_joined", () => {
      if (ownPosRef.current) {
        socket.emit("location", {
          lat: ownPosRef.current.lat,
          lon: ownPosRef.current.lon,
        });
      }
    });

    // ── Request/fulfillment events ─────────────────────────────────────────

    socket.on("incoming_request", (data: IncomingRequest) => {
      setPendingRequest(data);
    });

    socket.on(
      "media_received",
      (data: { type: "photo" | "video"; duration?: number; byName: string; uri: string }) => {
        addAlbumItemRef.current({
          type: data.type,
          byName: data.byName,
          uri: data.uri,
          ...(data.duration ? { duration: data.duration } : {}),
        });
        setLastReceivedAt(Date.now());
      }
    );

    socket.on("request_declined", (data: { byName: string }) => {
      setRequestDeclinedBy(data.byName);
    });

    // ── App-state refresh (iOS 26) ─────────────────────────────────────────

    function handleAppStateChange(next: AppStateStatus) {
      if (next === "active" && ownPosRef.current) {
        socket.emit("location", {
          lat: ownPosRef.current.lat,
          lon: ownPosRef.current.lon,
        });
      }
    }
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    startLocationWatch(socket);

    return () => {
      appStateSub.remove();
      socket.disconnect();
      posSubRef.current?.remove();
      posSubRef.current = null;
    };
  }, [user?.id]);

  async function startLocationWatch(socket: Socket) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      try {
        const snap = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        ownPosRef.current = { lat: snap.coords.latitude, lon: snap.coords.longitude };
        socket.emit("location", { lat: snap.coords.latitude, lon: snap.coords.longitude });
      } catch {}

      posSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 5 },
        (loc) => {
          ownPosRef.current = { lat: loc.coords.latitude, lon: loc.coords.longitude };
          socket.emit("location", { lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      );
    } catch {}
  }

  return (
    <SocketContext.Provider
      value={{ nearbyUsers, isConnected, pendingRequest, lastReceivedAt, requestDeclinedBy, sendRequest, acceptRequest, declineRequest, deliverMedia }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
