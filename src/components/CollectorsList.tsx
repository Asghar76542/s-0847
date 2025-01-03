import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';
import { Accordion } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import CollectorCard from './collectors/CollectorCard';
import CollectorsHeader from './collectors/CollectorsHeader';

type MemberCollector = Database['public']['Tables']['members_collectors']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

const CollectorsList = () => {
  const { toast } = useToast();

  // Fetch all members for the master print functionality
  const { data: allMembers, isError: membersError } = useQuery({
    queryKey: ['all_members'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('member_number', { ascending: true });
        
        if (error) throw error;
        return data as Member[];
      } catch (error) {
        console.error('Error fetching members:', error);
        toast({
          title: "Error",
          description: "Failed to fetch members list",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const { 
    data: collectors, 
    isLoading: collectorsLoading, 
    error: collectorsError 
  } = useQuery({
    queryKey: ['members_collectors'],
    queryFn: async () => {
      console.log('Fetching collectors from members_collectors...');
      try {
        const { data: collectorsData, error: collectorsError } = await supabase
          .from('members_collectors')
          .select(`
            id,
            name,
            prefix,
            number,
            email,
            phone,
            active,
            created_at,
            updated_at
          `)
          .order('number', { ascending: true });
        
        if (collectorsError) {
          console.error('Error fetching collectors:', collectorsError);
          throw collectorsError;
        }

        const collectorsWithCounts = await Promise.all(collectorsData?.map(async (collector) => {
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('collector', collector.name);
          
          return {
            ...collector,
            memberCount: count || 0
          };
        }) || []);

        return collectorsWithCounts;
      } catch (error) {
        console.error('Error processing collectors:', error);
        toast({
          title: "Error",
          description: "Failed to fetch collectors information",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  // Calculate total members across all collectors
  const totalMembers = collectors?.reduce((total, collector) => total + (collector.memberCount || 0), 0) || 0;

  if (collectorsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (collectorsError || membersError) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-red-500">Error loading data</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!collectors?.length) {
    return (
      <div className="text-center py-8 text-dashboard-text">
        No collectors found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CollectorsHeader 
        totalMembers={totalMembers}
        totalCollectors={collectors.length}
        allMembers={allMembers}
      />

      <Accordion type="single" collapsible className="space-y-4">
        {collectors.map((collector) => (
          <CollectorCard key={collector.id} collector={collector} />
        ))}
      </Accordion>
    </div>
  );
};

export default CollectorsList;