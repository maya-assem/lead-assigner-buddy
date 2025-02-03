import { AgentMetrics } from '../types/metrics';

// Simulate database operations using localStorage
const ASSIGNMENTS_KEY = 'lead_assignments';
const METRICS_KEY = 'agent_metrics';

export const recordAssignment = (
  leadId: string,
  leadName: string,
  agentId: string,
  agentName: string,
  assignmentMethod: 'performance' | 'availability'
) => {
  const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]');
  assignments.push({
    lead_id: leadId,
    lead_name: leadName,
    agent_id: agentId,
    agent_name: agentName,
    assignment_method: assignmentMethod,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
};

export const getAgentMetrics = (agentId: string): AgentMetrics | null => {
  const metrics = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
  return metrics[agentId] || null;
};

export const updateAgentMetrics = (
  agentId: string,
  metrics: {
    conversion_rate: number;
    avg_deal_value: number;
    response_time: number;
  }
) => {
  const allMetrics = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
  
  // Calculate performance score
  const performanceScore = 
    (0.4 * metrics.conversion_rate) +
    (0.3 * metrics.avg_deal_value / 100) +
    (0.3 * (100 - metrics.response_time));

  allMetrics[agentId] = {
    ...metrics,
    performance_score: performanceScore,
    last_updated: new Date().toISOString()
  };

  localStorage.setItem(METRICS_KEY, JSON.stringify(allMetrics));
  return allMetrics[agentId];
};

export const getRecentAssignments = (limit: number = 50) => {
  const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]');
  return assignments.slice(0, limit);
};