import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'member' | 'collector' | 'admin' | null;

interface RoleContextType {
  userRole: UserRole;
  isLoading: boolean;
  error: Error | null;
  canAccessTab: (tab: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      console.log('Fetching user role from central context...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found in central role check');
        return null;
      }

      console.log('Session user in central role check:', session.user.id);

      try {
        const { data: role, error: rpcError } = await supabase.rpc('get_user_role', {
          user_auth_id: session.user.id
        });

        if (rpcError) {
          console.error('Error fetching role in central context:', rpcError);
          toast({
            title: "Error fetching role",
            description: rpcError.message,
            variant: "destructive",
          });
          throw rpcError;
        }

        console.log('Fetched role from central context:', role);
        return role as UserRole;
      } catch (error) {
        console.error('Unexpected error in role fetch:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user role. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 2,
    meta: {
      errorMessage: "Failed to fetch user role"
    }
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return true;
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return (
    <RoleContext.Provider value={{ userRole, isLoading, error, canAccessTab }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}