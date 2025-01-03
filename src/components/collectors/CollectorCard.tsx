import { UserCheck } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import CollectorMembers from "@/components/CollectorMembers";
import PrintButtons from "@/components/PrintButtons";

export interface CollectorWithCount {
  id: string;
  name: string | null;
  prefix: string | null;
  number: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
  memberCount: number;
}

interface CollectorCardProps {
  collector: CollectorWithCount;
}

const CollectorCard = ({ collector }: CollectorCardProps) => {
  return (
    <AccordionItem
      key={collector.id}
      value={collector.id}
      className="bg-dashboard-card border border-white/10 rounded-lg overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dashboard-accent1 flex items-center justify-center text-white font-medium">
              {collector.prefix}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{collector.name}</p>
                <span className="text-sm text-gray-400">#{collector.number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-dashboard-text">
                <UserCheck className="w-4 h-4" />
                <span>Collector</span>
                <span className="text-purple-400">({collector.memberCount} members)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButtons collectorName={collector.name || ''} />
            <div className={`px-3 py-1 rounded-full ${
              collector.active 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {collector.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 mt-2">
          {collector.memberCount > 0 ? (
            <CollectorMembers collectorName={collector.name || ''} />
          ) : (
            <p className="text-sm text-gray-400">No members assigned to this collector</p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CollectorCard;