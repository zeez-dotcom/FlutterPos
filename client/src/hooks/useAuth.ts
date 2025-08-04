import { useQuery } from "@tanstack/react-query";
import type { User, Branch } from "@shared/schema";

type AuthUser = User & { branch?: Branch | null };

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    branch: user?.branch,
    isLoading,
    isAuthenticated: !!user && !error,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
  };
}