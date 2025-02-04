import { Deal } from './bitrixApi';

interface AgentMetrics {
  conversion_rate: number;
  avg_deal_value: number;
  response_time: number;
  performance_score: number;
  last_updated: string;
}

const metricsStore = new Map<string, AgentMetrics>();

export const calculateAgentMetrics = (deals: Deal[]): AgentMetrics => {
  const closedDeals = deals.filter(deal => deal.CLOSED === 'Y');
  const totalDeals = deals.length;
  
  // Calculate conversion rate (closed deals / total deals)
  const conversion_rate = totalDeals > 0 ? (closedDeals.length / totalDeals) * 100 : 0;
  
  // Calculate average deal value
  const avg_deal_value = closedDeals.length > 0 
    ? closedDeals.reduce((sum, deal) => sum + (deal.OPPORTUNITY || 0), 0) / closedDeals.length 
    : 0;
  
  // Calculate performance score based on conversion rate and average deal value
  const performance_score = (conversion_rate * 0.6) + (Math.min(avg_deal_value / 10000, 100) * 0.4);

  return {
    conversion_rate,
    avg_deal_value,
    response_time: Math.random() * 100, // This would need real data from Bitrix
    performance_score,
    last_updated: new Date().toISOString()
  };
};

export const updateAgentMetrics = async (agentId: string, metrics: Partial<AgentMetrics>) => {
  const currentMetrics = metricsStore.get(agentId) || {
    conversion_rate: 0,
    avg_deal_value: 0,
    response_time: 0,
    performance_score: 0,
    last_updated: new Date().toISOString()
  };

  metricsStore.set(agentId, {
    ...currentMetrics,
    ...metrics,
    last_updated: new Date().toISOString()
  });
};

export const getAgentMetrics = (agentId: string): AgentMetrics | undefined => {
  return metricsStore.get(agentId);
};

export const recordAssignment = async (
  leadId: string,
  leadName: string,
  agentId: string,
  agentName: string,
  assignmentType: string
) => {
  console.log('Assignment recorded:', {
    leadId,
    leadName,
    agentId,
    agentName,
    assignmentType,
    timestamp: new Date().toISOString()
  });
};