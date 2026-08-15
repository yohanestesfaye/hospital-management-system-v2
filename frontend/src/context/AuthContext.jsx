import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hms_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email, password) => {
    if (
      email === "admin@hms.com" &&
      password === "admin123"
    ) {
      const loggedInUser = {
        id: 1,
        name: "Admin",
        email: "admin@hms.com",
        role: "Administrator",
      };

      localStorage.setItem(
        "hms_user",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);

      return {
        success: true,
      };
    }

    return {
      success: false,
      message: "Invalid email or password.",
    };
  };

  const logout = () => {
    localStorage.removeItem("hms_user");
    setUser(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}

export default AuthProvider;