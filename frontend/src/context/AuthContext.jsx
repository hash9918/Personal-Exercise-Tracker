import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const res = await api.me();
          setUser(res.user);
        } catch (e) {
          clearToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(name, email, password) {
    const res = await api.register({ name, email, password });
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
