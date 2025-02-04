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
  
  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.OPPORTUNITY) || 0), 0);
  const avg_deal_value = totalValue / totalDeals;

  const metrics = {
    conversion_rate: (wonDeals.length / totalDeals) * 100,
    avg_deal_value,
    response_time: 0,
    performance_score,
    last_updated: new Date().toISOString()
  };

  return metrics;
};

// Store metrics in localStorage
const METRICS_STORAGE_KEY = 'agent_metrics';

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

// For compatibility with existing code, maintain a cache of metrics in memory
const metricsCache = new Map<string, AgentMetrics>();

export const getAgentMetrics = (agentId: string): AgentMetrics => {
  // First try to get from cache
  const cachedMetrics = metricsCache.get(agentId);
  if (cachedMetrics) return cachedMetrics;

  // If not in cache, try to get from localStorage
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

  // Return default metrics if nothing is found
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
  agentName: string, 
  method: string
) => {
  const assignment = {
    lead_id: leadId,
    lead_title: leadTitle,
    agent_id: agentId,
    agent_name: agentName,
    method,
    timestamp: new Date().toISOString()
  };

  try {
    const ASSIGNMENTS_STORAGE_KEY = 'lead_assignments';
    const storedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    const assignments = storedAssignments ? JSON.parse(storedAssignments) : [];
    
    assignments.push(assignment);
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to store assignment in localStorage:', error);
  }
};