
import { AgentMetrics } from '../types/metrics';

export const calculateAgentMetrics = (deals: any[]) => {
  const totalDeals = deals.length;
  if (totalDeals === 0) return {
    conversion_rate: 0,
    avg_deal_value: 0,
    response_time: 0,
    performance_score: 0,
    last_updated: new Date().toISOString()
  };

  const wonDeals = deals.filter(deal => deal.STAGE_ID === 'WON' || deal.STAGE_ID === 'CLOSED_WON');
  const performance_score = (wonDeals.length / totalDeals) * 100;
  
  const metrics = {
    conversion_rate: (wonDeals.length / totalDeals) * 100,
    avg_deal_value: 0,
    response_time: 0,
    performance_score,
    last_updated: new Date().toISOString()
  };

  return metrics;
};

// Store metrics in localStorage
const METRICS_STORAGE_KEY = 'agent_metrics';
const ASSIGNMENTS_STORAGE_KEY = 'lead_assignments';

export const updateAgentMetrics = async (agentId: string, metrics: AgentMetrics) => {
  try {
    const storedMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
    const allMetrics = storedMetrics ? JSON.parse(storedMetrics) : {};
    
    allMetrics[agentId] = metrics;
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(allMetrics));
    
    // Also update the in-memory cache for immediate access
    metricsCache.set(agentId, metrics);
  } catch (error) {
    console.error('Failed to store metrics in localStorage:', error);
  }
};

const metricsCache = new Map<string, AgentMetrics>();

export const getAgentMetrics = (agentId: string): AgentMetrics => {
  const cachedMetrics = metricsCache.get(agentId);
  if (cachedMetrics) return cachedMetrics;

  try {
    const storedMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
    if (storedMetrics) {
      const allMetrics = JSON.parse(storedMetrics);
      if (allMetrics[agentId]) {
        metricsCache.set(agentId, allMetrics[agentId]);
        return allMetrics[agentId];
      }
    }
  } catch (error) {
    console.error('Failed to retrieve metrics from localStorage:', error);
  }

  return {
    conversion_rate: 0,
    avg_deal_value: 0,
    response_time: 0,
    performance_score: 0,
    last_updated: new Date().toISOString()
  };
};

export const recordAssignment = async (
  leadId: string, 
  leadTitle: string, 
  agentId: string, 
  agentName: string
) => {
  const assignment = {
    lead_id: leadId,
    lead_title: leadTitle,
    agent_id: agentId,
    agent_name: agentName,
    timestamp: new Date().toISOString()
  };

  try {
    const storedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    const assignments = storedAssignments ? JSON.parse(storedAssignments) : [];
    
    assignments.push(assignment);
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to store assignment in localStorage:', error);
  }
};

export const getAssignmentCount = (agentId: string): number => {
  try {
    const storedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!storedAssignments) return 0;
    
    const assignments = JSON.parse(storedAssignments);
    return assignments.filter((a: any) => a.agent_id === agentId).length;
  } catch (error) {
    console.error('Failed to get assignment count:', error);
    return 0;
  }
};
