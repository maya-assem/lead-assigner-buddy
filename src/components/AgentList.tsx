import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Agent } from '../services/bitrixApi';
import { getAgentMetrics } from '../services/database';
import { useAssignmentStore } from '../stores/assignmentStore';

interface AgentListProps {
  agents: Agent[];
}

export const AgentList = ({ agents }: AgentListProps) => {
  const assignments = useAssignmentStore((state) => state.assignments);

  // Sort agents by total deals count
  const sortedAgents = [...agents]
    .filter(agent => agent.ACTIVE)
    .sort((a, b) => {
      const aDeals = assignments.filter(assign => assign.agentId === a.ID).length;
      const bDeals = assignments.filter(assign => assign.agentId === b.ID).length;
      return bDeals - aDeals;
    });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Active Agents (Sorted by Deal Count)</h2>
      <ScrollArea className="h-[200px]">
        {sortedAgents.map((agent) => {
          const metrics = getAgentMetrics(agent.ID);
          const currentDeals = assignments.filter(a => a.agentId === agent.ID).length;
          console.log(`Agent ${agent.NAME}: Current Deals Count = ${currentDeals}`);
          
          return (
            <div key={agent.ID} className="flex items-center justify-between p-2 border-b">
              <div>
                <span>{agent.NAME} {agent.LAST_NAME}</span>
                {metrics && (
                  <div className="text-xs text-muted-foreground">
                    Performance Score: {metrics.performance_score?.toFixed(2)}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {currentDeals} current deals
              </span>
            </div>
          );
        })}
      </ScrollArea>
    </Card>
  );
};