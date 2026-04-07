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

  useEffect(() => {
    // Only initialize socket on client side, not during build or SSR
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const initializeSocket = async () => {
      try {
        // Fetch token from backend (from httpOnly cookie)
        const tokenResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/auth/get-socket-token`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!tokenResponse.ok) {
          setIsLoading(false);
          return;
        }

        const { token } = await tokenResponse.json();

        if (!token) {
          setIsLoading(false);
          return;
        }

        // Get user ID from token
        const currentUserId = getCurrentUserId();
        setUserId(currentUserId);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        // Initialize socket connection
        const socketInstance = io(backendUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        // Connection events
        socketInstance.on("connect", () => {
          setIsConnected(true);
          setIsLoading(false);
        });

        socketInstance.on("connect_error", () => {
          setIsConnected(false);
          setIsLoading(false);
        });

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
        });

        socketInstance.on("error", () => {
          // Handle error silently
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
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
