import React, { createContext, useContext, useState } from "react";

type AuthState = {
  userId: string | null;       // UUID from backend
  token: string | null;        // JWT Bearer token
  isGuest: boolean;
  guestId: string | null;
  diningAlias: string | null;  // @username shown in sessions and used for friend lookup
};

type AuthContextType = AuthState & {
  setAuth: (partial: Partial<AuthState>) => void;
  loginAsGuest: () => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_STATE: AuthState = {
  userId: null,
  token: null,
  isGuest: false,
  guestId: null,
  diningAlias: null,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuthState] = useState<AuthState>(DEFAULT_STATE);

  const setAuth = (partial: Partial<AuthState>) =>
    setAuthState((prev) => ({ ...prev, ...partial }));

  const loginAsGuest = () =>
    setAuthState({ userId: null, token: null, isGuest: true, guestId: generateUUID() });

  const clearAuth = () => setAuthState(DEFAULT_STATE);

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, loginAsGuest, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
