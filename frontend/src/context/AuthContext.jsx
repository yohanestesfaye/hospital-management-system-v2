import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/hospitalServices";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hms_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify stored token on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("hms_token");
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem("hms_user", JSON.stringify(res.data));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem("hms_token", res.token);
        localStorage.setItem("hms_user", JSON.stringify(res.user));
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return {
        success: false,
        message: res.message || "Login failed",
      };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to connect to hospital server. Please try again.";
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    setUser(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}

export default AuthProvider;