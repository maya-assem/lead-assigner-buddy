import Database from 'better-sqlite3';
import { AgentMetrics } from '../types/metrics';

const db = new Database('crm.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_metrics (
    agent_id TEXT PRIMARY KEY,
    conversion_rate REAL,
    avg_deal_value REAL,
    response_time REAL,
    performance_score REAL,
    last_updated TEXT
  );
`);

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

  // Calculate performance score (example formula)
  const performance_score = (conversion_rate * 0.6) + ((avg_deal_value / 10000) * 0.4);

  return {
    conversion_rate,
    avg_deal_value,
    response_time: 0, // This could be calculated if we have timestamp data
    performance_score,
    last_updated: new Date().toISOString()
  };
};

export const updateAgentMetrics = async (agentId: string, metrics: AgentMetrics) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agent_metrics 
    (agent_id, conversion_rate, avg_deal_value, response_time, performance_score, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    agentId,
    metrics.conversion_rate,
    metrics.avg_deal_value,
    metrics.response_time,
    metrics.performance_score,
    metrics.last_updated
  );
};

export const getAgentMetrics = (agentId: string): AgentMetrics => {
  const stmt = db.prepare('SELECT * FROM agent_metrics WHERE agent_id = ?');
  const result = stmt.get(agentId);
  
  if (!result) {
    return {
      conversion_rate: 0,
      avg_deal_value: 0,
      response_time: 0,
      performance_score: 0,
      last_updated: new Date().toISOString()
    };
  }
  
  return result as AgentMetrics;
};

export const recordAssignment = async (
  leadId: string, 
  leadTitle: string, 
  agentId: string, 
  agentName: string, 
  method: string
) => {
  const stmt = db.prepare(`
    INSERT INTO assignments (lead_id, lead_title, agent_id, agent_name, method, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    leadId,
    leadTitle,
    agentId,
    agentName,
    method,
    new Date().toISOString()
  );
};