import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Lead } from '../services/bitrixApi';

interface LeadListProps {
  leads: Lead[];
}

export const LeadList = ({ leads }: LeadListProps) => {
  const unassignedLeads = leads.filter(lead => !lead.ASSIGNED_BY_ID);
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Unassigned Leads</h2>
      <ScrollArea className="h-[200px]">
        {unassignedLeads.map((lead) => (
          <div key={lead.ID} className="p-2 border-b">
            <span>{lead.TITLE}</span>
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
};