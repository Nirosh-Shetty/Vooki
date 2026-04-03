/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getCurrentUserId } from "./decode-token";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
  userId: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  console.log("🎯 SocketProvider mounting...");

  useEffect(() => {
    // Only initialize socket on client side, not during build or SSR
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    console.log("⏱️  SocketProvider useEffect running");
    
    const initializeSocket = async () => {
      try {
        console.log("📡 Fetching socket token from backend...");
        
        // Fetch token from backend (from httpOnly cookie)
        const tokenResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/auth/get-socket-token`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies
          }
        );

        if (!tokenResponse.ok) {
          console.warn("⚠️ Failed to fetch socket token:", tokenResponse.status);
          setIsLoading(false);
          return;
        }

        const { token } = await tokenResponse.json();
        console.log("✅ Socket token fetched successfully");
        console.log("   Token preview:", token ? token.substring(0, 20) + "..." : "NULL");

        if (!token) {
          console.warn("⚠️ No token in response");
          setIsLoading(false);
          return;
        }

        // Get user ID from token
        const currentUserId = getCurrentUserId();
        setUserId(currentUserId);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        console.log("🔗 Connecting to socket.io at:", backendUrl);
        console.log("🆔 User ID from token:", currentUserId);

        // Initialize socket connection
        console.log("📊 Creating socket instance...");
        const socketInstance = io(backendUrl, {
          auth: {
            token,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        console.log("📌 Socket instance created:", socketInstance.id);

        // Connection events
        socketInstance.on("connect", () => {
          console.log("✅ Socket connected:", socketInstance.id);
          setIsConnected(true);
          setIsLoading(false);
        });

        socketInstance.on("connect_error", (error: any) => {
          console.error("❌ Socket connection error:", error);
          console.error("   Error message:", error.message);
          console.error("   Error type:", error.type);
          setIsConnected(false);
          setIsLoading(false);
        });

        socketInstance.on("disconnect", () => {
          console.log("🔓 Socket disconnected");
          setIsConnected(false);
        });

        socketInstance.on("error", (error: any) => {
          console.error("❌ Socket error event:", error);
        });

        setSocket(socketInstance);

        return () => {
          console.log("🧹 Cleaning up socket connection");
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error("❌ Socket initialization error:", error);
        setIsLoading(false);
      }
    };

    initializeSocket();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isLoading, userId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
