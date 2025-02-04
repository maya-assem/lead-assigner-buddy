import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bitrixApi, Lead, Agent, Deal } from '../services/bitrixApi';
import { useAssignmentStore } from '../stores/assignmentStore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { recordAssignment, getAgentMetrics, updateAgentMetrics, calculateAgentMetrics } from '../services/database';

export const Dashboard = () => {
  const { toast } = useToast();
  const addAssignment = useAssignmentStore((state) => state.addAssignment);
  const assignments = useAssignmentStore((state) => state.assignments);
  const [usePerformanceBased, setUsePerformanceBased] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => bitrixApi.getActiveAgents(),
    refetchInterval: 30000,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => bitrixApi.getNewLeads(),
    refetchInterval: 10000,
  });

  // Fetch and update agent metrics
  useEffect(() => {
    const updateMetricsFromDeals = async () => {
      for (const agent of agents) {
        try {
          // Fetch last 10 deals for each agent
          const deals = await bitrixApi.getAgentDeals(agent.ID, 10);
          console.log(`Fetched ${deals.length} deals for agent ${agent.NAME}`);
          
          // Calculate metrics based on real deal data
          const metrics = calculateAgentMetrics(deals);
          console.log(`Calculated metrics for agent ${agent.NAME}:`, metrics);
          
          // Update stored metrics
          await updateAgentMetrics(agent.ID, metrics);
        } catch (error) {
          console.error(`Failed to update metrics for agent ${agent.NAME}:`, error);
        }
      }
    };

    // Update metrics daily and on component mount
    const lastUpdate = localStorage.getItem('lastMetricsUpdate');
    const now = new Date().toISOString();
    if (!lastUpdate || new Date(lastUpdate).getDate() !== new Date(now).getDate()) {
      updateMetricsFromDeals();
      localStorage.setItem('lastMetricsUpdate', now);
    }
  }, [agents]);

  const selectAgentByPerformance = (activeAgents: Agent[]) => {
    const agentScores = activeAgents.map(agent => {
      const metrics = getAgentMetrics(agent.ID);
      return {
        agent,
        score: metrics?.performance_score || 0
      };
    });

    return agentScores.sort((a, b) => {
      const aWorkload = assignments.filter(assign => assign.agentId === a.agent.ID).length;
      const bWorkload = assignments.filter(assign => assign.agentId === b.agent.ID).length;
      
      const aScore = a.score - (aWorkload * 10);
      const bScore = b.score - (bWorkload * 10);
      
      return bScore - aScore;
    })[0]?.agent;
  };

  const selectAgentByAvailability = (activeAgents: Agent[]) => {
    const agentLeadCounts = new Map<string, number>();
    assignments.forEach(assignment => {
      agentLeadCounts.set(
        assignment.agentId,
        (agentLeadCounts.get(assignment.agentId) || 0) + 1
      );
    });

    return activeAgents.sort((a, b) => 
      (agentLeadCounts.get(a.ID) || 0) - (agentLeadCounts.get(b.ID) || 0)
    )[0];
  };

  useEffect(() => {
    const assignLeads = async () => {
      const newLeads = leads.filter(lead => !lead.ASSIGNED_BY_ID);
      
      if (newLeads.length && agents.length) {
        const activeAgents = agents.filter(agent => agent.ACTIVE);
        
        if (activeAgents.length > 0) {
          const selectedAgent = usePerformanceBased
            ? selectAgentByPerformance(activeAgents)
            : selectAgentByAvailability(activeAgents);

          if (selectedAgent) {
            for (const lead of newLeads) {
              try {
                await bitrixApi.assignLead(lead.ID, selectedAgent.ID);
                addAssignment(lead, selectedAgent);
                
                await recordAssignment(
                  lead.ID,
                  lead.TITLE,
                  selectedAgent.ID,
                  `${selectedAgent.NAME} ${selectedAgent.LAST_NAME}`,
                  usePerformanceBased ? 'performance' : 'availability'
                );

                toast({
                  title: "Lead Assigned",
                  description: `${lead.TITLE} assigned to ${selectedAgent.NAME} ${selectedAgent.LAST_NAME} (${usePerformanceBased ? 'Performance' : 'Availability'} based)`,
                });
              } catch (error) {
                console.error('Failed to assign lead:', error);
                toast({
                  title: "Assignment Failed",
                  description: "Failed to assign lead. Please try again.",
                  variant: "destructive",
                });
              }
            }
          }
          
          setUsePerformanceBased(prev => !prev);
        }
      }
    };

    assignLeads();
  }, [leads, agents, addAssignment, assignments, toast, usePerformanceBased]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Lead Assignment Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
          <ScrollArea className="h-[200px]">
            {agents.filter(agent => agent.ACTIVE).map((agent) => {
              const metrics = getAgentMetrics(agent.ID);
              return (
                <div key={agent.ID} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <span>{agent.NAME} {agent.LAST_NAME}</span>
                    {metrics && (
                      <div className="text-xs text-muted-foreground">
                        <div>Performance Score: {metrics.performance_score.toFixed(2)}</div>
                        <div>Conversion Rate: {metrics.conversion_rate.toFixed(1)}%</div>
                        <div>Avg Deal Value: ${metrics.avg_deal_value.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {assignments.filter(a => a.agentId === agent.ID).length} leads
                  </span>
                </div>
              );
            })}
          </ScrollArea>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Unassigned Leads</h2>
          <ScrollArea className="h-[200px]">
            {leads.filter(lead => !lead.ASSIGNED_BY_ID).map((lead) => (
              <div key={lead.ID} className="p-2 border-b">
                <span>{lead.TITLE}</span>
              </div>
            ))}
          </ScrollArea>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Assignments</h2>
        <ScrollArea className="h-[300px]">
          {assignments.map((assignment, index) => (
            <div key={index} className="p-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{assignment.leadName}</p>
                  <p className="text-sm text-muted-foreground">
                    Assigned to: {assignment.agentName}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(assignment.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </Card>
    </div>
  );
};
