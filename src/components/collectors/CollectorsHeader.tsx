import { Users, UserCheck } from 'lucide-react';
import TotalCount from "@/components/TotalCount";
import PrintButtons from "@/components/PrintButtons";
import { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['members']['Row'];

interface CollectorsHeaderProps {
  totalMembers: number;
  totalCollectors: number;
  allMembers?: Member[];
}

const CollectorsHeader = ({ totalMembers, totalCollectors, allMembers }: CollectorsHeaderProps) => {
  return (
    <div className="space-y-4">
      <TotalCount 
        items={[
          {
            count: totalMembers,
            label: "Total Members",
            icon: <Users className="w-6 h-6 text-blue-400" />
          },
          {
            count: totalCollectors,
            label: "Total Collectors",
            icon: <UserCheck className="w-6 h-6 text-purple-400" />
          }
        ]}
      />
      <div className="flex justify-end mb-4">
        <PrintButtons allMembers={allMembers} />
      </div>
    </div>
  );
};

export default CollectorsHeader;