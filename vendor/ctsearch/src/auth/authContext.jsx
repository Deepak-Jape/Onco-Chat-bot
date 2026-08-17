// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "./authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      const userData = await authService.getCurrentUser();
      setUser(userData?.user || null);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    authService.login();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
