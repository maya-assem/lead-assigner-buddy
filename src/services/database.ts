import { AgentMetrics } from '../types/metrics';

const METRICS_KEY = 'agent_metrics';
const ASSIGNMENTS_KEY = 'assignments';

export const calculateAgentMetrics = (deals: any[]) => {
  const totalDeals = deals.length;
  if (totalDeals === 0) return {
    conversion_rate: 0,
    avg_deal_value: 0,
    response_time: 0,
    performance_score: 0,
    last_updated: new Date().toISOString()
  };

  const closedDeals = deals.filter(deal => deal.CLOSED === 'Y');
  const conversion_rate = (closedDeals.length / totalDeals) * 100;
  
  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.OPPORTUNITY) || 0), 0);
  const avg_deal_value = totalValue / totalDeals;

  const performance_score = (conversion_rate * 0.6) + ((avg_deal_value / 10000) * 0.4);

  return {
    conversion_rate,
    avg_deal_value,
    response_time: 0,
    performance_score,
    last_updated: new Date().toISOString()
  };
};

export const updateAgentMetrics = async (agentId: string, metrics: AgentMetrics) => {
  const allMetrics = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
  allMetrics[agentId] = metrics;
  localStorage.setItem(METRICS_KEY, JSON.stringify(allMetrics));
};

export const getAgentMetrics = (agentId: string): AgentMetrics => {
  const allMetrics = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
  const metrics = allMetrics[agentId];
  
  if (!metrics) {
    return {
      conversion_rate: 0,
      avg_deal_value: 0,
      response_time: 0,
      performance_score: 0,
      last_updated: new Date().toISOString()
    };
  }
  
  return metrics as AgentMetrics;
};

export const recordAssignment = async (
  leadId: string, 
  leadTitle: string, 
  agentId: string, 
  agentName: string, 
  method: string
) => {
  const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]');
  assignments.push({
    lead_id: leadId,
    lead_title: leadTitle,
    agent_id: agentId,
    agent_name: agentName,
    method,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
};