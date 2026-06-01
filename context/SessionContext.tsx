import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "http://10.0.0.129:5000";

export type LatLng = { latitude: number; longitude: number };

type SessionContextType = {
  sessionId: string | null;
  userLocation: LatLng | null;
  setUserLocation: (loc: LatLng) => void;
  startSession: () => Promise<string | null>;
  clearSession: () => void;
  resumePath: string | null;
  setResumePath: (path: string | null) => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const { userId, isGuest, guestId } = useAuth();

  const startSession = async (): Promise<string | null> => {
    setResumePath(null);
    try {
      const body = isGuest ? { guestId } : { userId };

      const response = await fetch(`${API_BASE}/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();

      if (json.success && json.sessionId) {
        setSessionId(json.sessionId);
        console.log(`Session started: ${json.sessionId}`);
        return json.sessionId;
      }

      console.warn("Session creation returned no ID:", json);
      return null;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  };

  const clearSession = () => {
    setSessionId(null);
    setUserLocation(null);
    setResumePath(null);
  };

  return (
    <SessionContext.Provider
      value={{ sessionId, userLocation, setUserLocation, startSession, clearSession, resumePath, setResumePath }}
    >
      {children}
    </SessionContext.Provider>
  );
};
