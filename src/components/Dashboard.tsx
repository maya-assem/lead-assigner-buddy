import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bitrixApi, Lead, Agent } from '../services/bitrixApi';
import { useAssignmentStore } from '../stores/assignmentStore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { recordAssignment, getAgentMetrics, updateAgentMetrics } from '../services/database';
import { AgentMetrics } from '../types/metrics';

export const Dashboard = () => {
  const { toast } = useToast();
  const addAssignment = useAssignmentStore((state) => state.addAssignment);
  const assignments = useAssignmentStore((state) => state.assignments);
  const [usePerformanceBased, setUsePerformanceBased] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      console.log('🔄 Fetching active agents from Bitrix24...');
      const result = await bitrixApi.getActiveAgents();
      console.log(`✅ Found ${result.length} agents in total`);
      return result;
    },
    refetchInterval: 30000,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      console.log('🔄 Fetching new leads from Bitrix24...');
      const result = await bitrixApi.getNewLeads();
      console.log(`✅ Found ${result.length} unassigned leads`);
      return result;
    },
    refetchInterval: 10000,
  });

  const selectAgentByPerformance = (activeAgents: Agent[]) => {
    console.log('📊 Selecting agent based on performance metrics...');
    const agentScores = activeAgents.map(agent => {
      const metrics = getAgentMetrics(agent.ID);
      console.log(`Agent ${agent.NAME}: Performance Score = ${metrics?.performance_score || 0}`);
      return {
        agent,
        score: metrics?.performance_score || 0
      };
    });

    const selectedAgent = agentScores.sort((a, b) => {
      const aWorkload = assignments.filter(assign => assign.agentId === a.agent.ID).length;
      const bWorkload = assignments.filter(assign => assign.agentId === b.agent.ID).length;
      
      const aScore = a.score - (aWorkload * 10);
      const bScore = b.score - (bWorkload * 10);
      
      console.log(`${a.agent.NAME}: Final Score = ${aScore} (Performance: ${a.score}, Workload: ${aWorkload})`);
      console.log(`${b.agent.NAME}: Final Score = ${bScore} (Performance: ${b.score}, Workload: ${bWorkload})`);
      
      return bScore - aScore;
    })[0]?.agent;

    console.log(`🎯 Selected agent: ${selectedAgent?.NAME || 'None'}`);
    return selectedAgent;
  };

  const selectAgentByAvailability = (activeAgents: Agent[]) => {
    console.log('⚖️ Selecting agent based on current workload...');
    const agentLeadCounts = new Map<string, number>();
    
    // Count all assignments, including historical ones from Bitrix
    activeAgents.forEach(agent => {
      const currentAssignments = assignments.filter(a => a.agentId === agent.ID).length;
      const metrics = getAgentMetrics(agent.ID);
      const historicalLeads = metrics?.total_leads || 0;
      const totalLeads = currentAssignments + historicalLeads;
      agentLeadCounts.set(agent.ID, totalLeads);
      console.log(`Agent ${agent.NAME}: Current=${currentAssignments}, Historical=${historicalLeads}, Total=${totalLeads}`);
    });

    const selectedAgent = activeAgents.sort((a, b) => 
      (agentLeadCounts.get(a.ID) || 0) - (agentLeadCounts.get(b.ID) || 0)
    )[0];

    console.log(`🎯 Selected agent by availability: ${selectedAgent?.NAME || 'None'}`);
    return selectedAgent;
  };

  useEffect(() => {
    const assignLeads = async () => {
      console.log('\n🔄 Starting lead assignment cycle...');
      const newLeads = leads.filter(lead => !lead.ASSIGNED_BY_ID);
      console.log(`Found ${newLeads.length} unassigned leads`);
      
      if (newLeads.length && agents.length) {
        const activeAgents = agents.filter(agent => agent.ACTIVE);
        console.log(`${activeAgents.length} active agents available`);
        
        if (activeAgents.length > 0) {
          const selectedAgent = usePerformanceBased
            ? selectAgentByPerformance(activeAgents)
            : selectAgentByAvailability(activeAgents);

          if (selectedAgent) {
            for (const lead of newLeads) {
              try {
                console.log(`📝 Assigning lead "${lead.TITLE}" to ${selectedAgent.NAME}...`);
                await bitrixApi.assignLead(lead.ID, selectedAgent.ID);
                addAssignment(lead, selectedAgent);
                
                await recordAssignment(
                  lead.ID,
                  lead.TITLE,
                  selectedAgent.ID,
                  `${selectedAgent.NAME} ${selectedAgent.LAST_NAME}`,
                  usePerformanceBased ? 'performance' : 'availability'
                );

                console.log('✅ Assignment completed successfully');
                toast({
                  title: "Lead Assigned",
                  description: `${lead.TITLE} assigned to ${selectedAgent.NAME} ${selectedAgent.LAST_NAME} (${usePerformanceBased ? 'Performance' : 'Availability'} based)`,
                });
              } catch (error) {
                console.error('❌ Failed to assign lead:', error);
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

  useEffect(() => {
    const updateMetrics = async () => {
      agents.forEach(agent => {
        updateAgentMetrics(agent.ID, {
          conversion_rate: Math.random() * 100, // Example: Random conversion rate
          avg_deal_value: Math.random() * 10000, // Example: Random deal value
          response_time: Math.random() * 100, // Example: Random response time
        });
      });
    };

    updateMetrics();
  }, [agents]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Lead Assignment Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
          <ScrollArea className="h-[200px]">
            {agents.filter(agent => agent.ACTIVE).map((agent) => {
              const metrics = getAgentMetrics(agent.ID);
              const currentAssignments = assignments.filter(a => a.agentId === agent.ID).length;
              const historicalLeads = metrics?.total_leads || 0;
              const totalLeads = currentAssignments + historicalLeads;
              
              return (
                <div key={agent.ID} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <span>{agent.NAME} {agent.LAST_NAME}</span>
                    {metrics && (
                      <div className="text-xs text-muted-foreground">
                        Performance Score: {metrics.performance_score.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalLeads} leads total
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
    </div>
  );
};