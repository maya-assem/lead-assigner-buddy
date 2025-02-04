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

  const closedDeals = deals.filter(deal => deal.CLOSED === 'Y');
  const conversion_rate = (closedDeals.length / totalDeals) * 100;
  
  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.OPPORTUNITY) || 0), 0);
  const avg_deal_value = totalValue / totalDeals;

  // Performance score calculation:
  // conversion_rate contributes 60% of the score (0-60 points)
  // avg_deal_value contributes 40% of the score (0-40 points, normalized where $10,000 = 40 points)
  const normalizedDealValue = Math.min((avg_deal_value / 10000) * 40, 40);
  const performance_score = (conversion_rate * 0.6) + normalizedDealValue;

  return {
    conversion_rate,
    avg_deal_value,
    response_time: 0,
    performance_score,
    last_updated: new Date().toISOString()
  };
};

// Store metrics in CSV format
export const exportMetricsToCSV = async (agentId: string, agentName: string, metrics: AgentMetrics) => {
  const csvContent = `Agent ID,Agent Name,Performance Score,Conversion Rate,Avg Deal Value,Last Updated\n${agentId},${agentName},${metrics.performance_score},${metrics.conversion_rate},${metrics.avg_deal_value},${metrics.last_updated}`;
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `agent_metrics_${agentId}.csv`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// For compatibility with existing code, maintain a cache of metrics in memory
const metricsCache = new Map<string, AgentMetrics>();

export const updateAgentMetrics = async (agentId: string, metrics: AgentMetrics) => {
  metricsCache.set(agentId, metrics);
};

export const getAgentMetrics = (agentId: string): AgentMetrics => {
  return metricsCache.get(agentId) || {
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

  // Create CSV content for the assignment
  const csvContent = `Lead ID,Lead Title,Agent ID,Agent Name,Method,Timestamp\n${leadId},"${leadTitle}",${agentId},"${agentName}",${method},${assignment.timestamp}`;
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `assignment_${leadId}.csv`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
