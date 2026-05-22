import { socketAuthMiddleware, AuthenticatedSocket } from "./auth.socket";
import { handleMessaging } from "./messaging.socket";

export const initializeSocket = (expressApp: any) => {
  let io: any;
  let httpServer: any;

  try {
    // Dynamically require socket.io to avoid import errors if not installed
    const SocketIO = require("socket.io").Server;
    const { createServer } = require("http");

    // Create HTTP server and attach Express app to it
    httpServer = createServer(expressApp);
    
    io = new SocketIO(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Apply authentication middleware
    io.use((socket: any, next: any) => {
      socketAuthMiddleware(socket, next);
    });

    // Connection handler
    io.on("connection", (socket: any) => {
      const userId = socket.userId;
      console.log(`✅ User ${userId} connected:`, socket.id);
      console.log(`   Socket rooms:`, socket.rooms);

      // Join user room for direct notifications
      socket.join(`user:${userId}`);
      console.log(`   Joined room: user:${userId}`);

      // Handle messaging events
      handleMessaging(io, socket, userId!);

      // Disconnect handler
      socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected:`, socket.id);
        socket.leave(`user:${userId}`);
      });

      // Error handler
      socket.on("error", (error: any) => {
        console.error("Socket error:", error);
      });
    });

    console.log("✅ Socket.io initialized successfully");
  } catch (error) {
    console.error("❌ Socket.io initialization failed:", error);
    console.warn("Make sure to install socket.io: npm install socket.io");
  }

  return { io, httpServer };
};

export default initializeSocket;
