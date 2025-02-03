import Database from 'better-sqlite3';

const db = new Database('assignments.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL,
    lead_name TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    assignment_method TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agent_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    conversion_rate REAL DEFAULT 0,
    avg_deal_value REAL DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    performance_score REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const recordAssignment = (
  leadId: string,
  leadName: string,
  agentId: string,
  agentName: string,
  assignmentMethod: 'performance' | 'availability'
) => {
  const stmt = db.prepare(`
    INSERT INTO assignments (lead_id, lead_name, agent_id, agent_name, assignment_method)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(leadId, leadName, agentId, agentName, assignmentMethod);
};

export const getAgentMetrics = (agentId: string) => {
  const stmt = db.prepare('SELECT * FROM agent_metrics WHERE agent_id = ?');
  return stmt.get(agentId);
};

export const updateAgentMetrics = (
  agentId: string,
  metrics: {
    conversion_rate: number;
    avg_deal_value: number;
    response_time: number;
  }
) => {
  // Calculate performance score
  const performanceScore = 
    (0.4 * metrics.conversion_rate) +
    (0.3 * metrics.avg_deal_value) +
    (0.3 * (100 - metrics.response_time)); // Inverse of response time as lower is better

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agent_metrics 
    (agent_id, conversion_rate, avg_deal_value, response_time, performance_score, last_updated)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  return stmt.run(
    agentId,
    metrics.conversion_rate,
    metrics.avg_deal_value,
    metrics.response_time,
    performanceScore
  );
};

export const getRecentAssignments = (limit: number = 50) => {
  const stmt = db.prepare(`
    SELECT * FROM assignments 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
};