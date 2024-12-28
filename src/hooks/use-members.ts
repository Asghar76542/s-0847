import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/components/members/types";
import { useToast } from "@/hooks/use-toast";

interface MembersData {
  members: Member[];
  totalCount: number;
}

export const useMembers = (page: number, searchTerm: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['members', page, searchTerm],
    queryFn: async (): Promise<MembersData> => {
      console.log('Starting members fetch...', { page, searchTerm });
      
      try {
        // First get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          throw userError;
        }

        if (!user) {
          throw new Error('No authenticated user found');
        }

        console.log('Current user:', user.id);

        // Get the user's profile to check their role and email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        // Initialize the query
        let query = supabase
          .from('members')
          .select('*', { count: 'exact' });

        // If user is a collector, only show their assigned members
        if (profile.role === 'collector') {
          console.log('Filtering members for collector with email:', profile.email);
          const { data: collector } = await supabase
            .from('collectors')
            .select('id')
            .eq('email', profile.email)
            .single();

          if (collector) {
            query = query.eq('collector_id', collector.id);
            console.log('Filtering by collector_id:', collector.id);
          }
        }

        // Apply search filter if searchTerm exists
        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`);
        }

        // Apply pagination
        const from = page * 20;
        const to = from + 19;
        
        const { data: members, error: queryError, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });
        
        if (queryError) {
          console.error('Error fetching members:', queryError);
          throw queryError;
        }
        
        console.log('Query completed. Members found:', members?.length);
        console.log('Total count:', count);
        
        return {
          members: members?.map(member => ({
            ...member,
            name: member.full_name
          })) || [],
          totalCount: count || 0
        };
      } catch (error) {
        console.error('Error in useMembers:', error);
        throw error;
      }
    },
    meta: {
      errorMessage: "Failed to load members"
    },
    retry: 1,
    staleTime: 30000, // Cache data for 30 seconds
    refetchOnWindowFocus: false // Prevent unnecessary refetches
  });
};