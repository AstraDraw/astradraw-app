import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getAuthStatus,
  getCurrentUser,
  redirectToLogin,
  logout as logoutApi,
  type User,
  type AuthStatus,
} from "./authApi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  oidcConfigured: boolean;
  login: (redirectPath?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oidcConfigured, setOidcConfigured] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if OIDC is configured
        const status = await getAuthStatus();
        setOidcConfigured(status.oidcConfigured);

        if (status.oidcConfigured) {
          // Try to get current user
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }

        // Check for auth callback result in URL
        if (window.location.hash.includes("auth=success")) {
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search,
          );
          // Refresh user after successful auth
          await refreshUser();
        }

        // Check for auth error in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        if (error) {
          console.error("Auth error:", error);
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [refreshUser]);

  const login = useCallback((redirectPath?: string) => {
    redirectToLogin(redirectPath);
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    oidcConfigured,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
