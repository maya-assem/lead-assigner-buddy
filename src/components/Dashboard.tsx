import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bitrixApi, Lead, Agent } from '../services/bitrixApi';
import { useAssignmentStore } from '../stores/assignmentStore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

export const Dashboard = () => {
  const { toast } = useToast();
  const addAssignment = useAssignmentStore((state) => state.addAssignment);
  const assignments = useAssignmentStore((state) => state.assignments);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => bitrixApi.getActiveAgents(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => bitrixApi.getNewLeads(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  useEffect(() => {
    const assignLeads = async () => {
      const newLeads = leads.filter(lead => !lead.ASSIGNED_BY_ID);
      
      if (newLeads.length && agents.length) {
        // Get agent with least leads
        const agentLeadCounts = new Map<string, number>();
        assignments.forEach(assignment => {
          agentLeadCounts.set(
            assignment.agentId,
            (agentLeadCounts.get(assignment.agentId) || 0) + 1
          );
        });

        const activeAgents = agents.filter(agent => agent.ACTIVE);
        const sortedAgents = activeAgents.sort((a, b) => 
          (agentLeadCounts.get(a.ID) || 0) - (agentLeadCounts.get(b.ID) || 0)
        );

        if (sortedAgents.length > 0) {
          const selectedAgent = sortedAgents[0];
          
          for (const lead of newLeads) {
            try {
              await bitrixApi.assignLead(lead.ID, selectedAgent.ID);
              addAssignment(lead, selectedAgent);
              toast({
                title: "Lead Assigned",
                description: `${lead.TITLE} assigned to ${selectedAgent.NAME} ${selectedAgent.LAST_NAME}`,
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
      }
    };

    assignLeads();
  }, [leads, agents, addAssignment, assignments, toast]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Lead Assignment Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
          <ScrollArea className="h-[200px]">
            {agents.filter(agent => agent.ACTIVE).map((agent) => (
              <div key={agent.ID} className="flex items-center justify-between p-2 border-b">
                <span>{agent.NAME} {agent.LAST_NAME}</span>
                <span className="text-sm text-muted-foreground">
                  {assignments.filter(a => a.agentId === agent.ID).length} leads
                </span>
              </div>
            ))}
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