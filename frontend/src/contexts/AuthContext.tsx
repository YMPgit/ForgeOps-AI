import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setToken, getToken } from '@/services/api';
import { setUserId, getUserId, migrateLegacyKeys } from '@/lib/userScope';
import type { AuthContextType, AuthCredentials, RegisterCredentials, User } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const bootstrap = async () => {
      const stored = getToken();
      if (stored) {
        setTokenState(stored);
        try {
          const me = await api.getCurrentUser();
          setUser(me);
          setUserId(String(me.id));
          migrateLegacyKeys(String(me.id));
        } catch {
          setToken(null);
          setTokenState(null);
          setUser(null);
          setUserId(null);
        }
      } else {
        setUserId(null);
      }
      queryClient.clear();
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (credentials: AuthCredentials) => {
    const res = await api.login(credentials);
    setToken(res.access_token);
    setTokenState(res.access_token);
    const me = await api.getCurrentUser();
    setUser(me);
    setUserId(String(me.id));
    migrateLegacyKeys(String(me.id));
    queryClient.clear();
  };

  const register = async (credentials: RegisterCredentials) => {
    const res = await api.register(credentials);
    setToken(res.access_token);
    setTokenState(res.access_token);
    const me = await api.getCurrentUser();
    setUser(me);
    setUserId(String(me.id));
    migrateLegacyKeys(String(me.id));
    queryClient.clear();
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setUserId(null);
    queryClient.clear();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-exported for easy scope-aware reads outside React.
export { getUserId };