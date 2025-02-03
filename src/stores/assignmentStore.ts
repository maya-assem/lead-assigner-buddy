import { create } from 'zustand';
import { Lead, Agent } from '../services/bitrixApi';

interface AssignmentRecord {
  leadId: string;
  leadName: string;
  agentId: string;
  agentName: string;
  timestamp: string;
}

interface AssignmentStore {
  assignments: AssignmentRecord[];
  addAssignment: (lead: Lead, agent: Agent) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  addAssignment: (lead: Lead, agent: Agent) =>
    set((state) => ({
      assignments: [
        {
          leadId: lead.ID,
          leadName: lead.TITLE,
          agentId: agent.ID,
          agentName: `${agent.NAME} ${agent.LAST_NAME}`,
          timestamp: new Date().toISOString(),
        },
        ...state.assignments,
      ],
    })),
}));