"use client";

import config from "@/lib/config";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Define the User type
export interface User {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  // Add any other user properties you need
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get the stored token
  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  const setToken = useCallback((token: string | null) => {
    localStorage.setItem("accessToken", token || "");
  }, []);

  useEffect(() => {
    console.log("AuthProvider mounted");
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch user info using the token if needed
        try {
          const response = await fetch(`${config.authUrl}/user-info`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token might be invalid
            localStorage.removeItem("accessToken");
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // Keep the token but set a minimal user object
          setUser({ _id: "unknown" });
          setIsAuthenticated(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, setToken]);

  // Redirect to the auth service for login - no parameters needed
  const login = () => {
    window.location.href = `${config.authUrl}/google`;
  };

  // Log out the user
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to home page
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getToken,
        setToken,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// export const useAuthDispatch = () => {
//   const context = useContext(AuthDispatchContext);
//   if (context === null) {
//     throw new Error("useAuthDispatch must be used within an AuthProvider");
//   }
//   return context;
// };
