import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { logger } from "./lib/logger";

interface UserLocation {
  socketId: string;
  userId: string;
  name: string;
  initials: string;
  color: string;
  lat: number;
  lon: number;
  lastSeen: number;
}

const USER_COLORS = [
  "#FF6B6B", "#FFB347", "#4ADEAD", "#F06EFF",
  "#5B8DEF", "#FFD93D", "#6BCB77", "#4D96FF",
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function attachSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const locations = new Map<string, UserLocation>();

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on(
      "join",
      (data: { userId: string; name: string; initials: string }) => {
        const entry: UserLocation = {
          socketId: socket.id,
          userId: data.userId,
          name: data.name,
          initials: data.initials,
          color: colorForUser(data.userId),
          lat: 0,
          lon: 0,
          lastSeen: Date.now(),
        };
        locations.set(socket.id, entry);
        logger.info({ userId: data.userId }, "User joined");

        // Send current users (who already have a position) to the new joiner
        const others = [...locations.values()].filter(
          (u) => u.socketId !== socket.id && u.lat !== 0
        );
        if (others.length > 0) {
          socket.emit(
            "nearby_update",
            others.map((u) => ({
              id: u.userId,
              name: u.name,
              initials: u.initials,
              color: u.color,
              lat: u.lat,
              lon: u.lon,
            }))
          );
        }

        // Ask every other connected user to re-emit their location immediately
        // so the new joiner sees them even if they haven't moved recently
        socket.broadcast.emit("peer_joined");
      }
    );

    socket.on("location", (data: { lat: number; lon: number }) => {
      const entry = locations.get(socket.id);
      if (!entry) return;

      entry.lat = data.lat;
      entry.lon = data.lon;
      entry.lastSeen = Date.now();

      // Rebuild full nearby list for this user
      const others = [...locations.values()].filter(
        (u) => u.socketId !== socket.id && u.lat !== 0
      );
      socket.emit(
        "nearby_update",
        others.map((u) => ({
          id: u.userId,
          name: u.name,
          initials: u.initials,
          color: u.color,
          lat: u.lat,
          lon: u.lon,
        }))
      );

      // Notify everyone else that this user moved
      socket.broadcast.emit("user_moved", {
        id: entry.userId,
        name: entry.name,
        initials: entry.initials,
        color: entry.color,
        lat: entry.lat,
        lon: entry.lon,
      });
    });

    socket.on(
      "photo_request",
      (data: {
        targetUserId: string;
        type: string;
        duration: number;
        requesterId: string;
        requesterName: string;
        requesterLat: number;
        requesterLon: number;
      }) => {
        const target = [...locations.values()].find(
          (u) => u.userId === data.targetUserId
        );
        if (target) {
          io.to(target.socketId).emit("incoming_request", {
            requesterId: data.requesterId,
            requesterName: data.requesterName,
            requesterLat: data.requesterLat,
            requesterLon: data.requesterLon,
            type: data.type,
            duration: data.duration,
          });
          logger.info(
            { from: data.requesterId, to: data.targetUserId, type: data.type },
            "Photo request routed"
          );
        }
      }
    );

    socket.on("photo_declined", (data: { requesterId: string }) => {
      const requester = [...locations.values()].find(u => u.userId === data.requesterId);
      const decliner = locations.get(socket.id);
      if (requester && decliner) {
        io.to(requester.socketId).emit("request_declined", { byName: decliner.name });
        logger.info({ by: decliner.userId, to: data.requesterId }, "Request declined");
      }
    });

    socket.on(
      "photo_delivered",
      (data: { requesterId: string; type: string; duration: number }) => {
        const requester = [...locations.values()].find(
          (u) => u.userId === data.requesterId
        );
        const deliverer = locations.get(socket.id);
        if (requester && deliverer) {
          io.to(requester.socketId).emit("media_received", {
            type: data.type,
            duration: data.duration,
            byName: deliverer.name,
            uri: `placeholder://received-${Date.now()}`,
          });
          logger.info(
            { from: deliverer.userId, to: data.requesterId },
            "Media delivered"
          );
        }
      }
    );

    socket.on("disconnect", () => {
      const entry = locations.get(socket.id);
      if (entry) {
        logger.info({ userId: entry.userId }, "User disconnected");
        locations.delete(socket.id);
        socket.broadcast.emit("user_left", entry.userId);
      }
    });
  });

  return io;
}
