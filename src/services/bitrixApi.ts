import axios from 'axios';

const BASE_URL = 'https://diet-hub.bitrix24.com/rest/1/q5iy1s9aemfpc1j1';

export interface Lead {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
  STAGE_ID: string;
  STAGE_NAME?: string;
}

export interface Deal {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  OPPORTUNITY: number;
  CLOSED: 'Y' | 'N';
  DATE_CREATE: string;
  STAGE_ID: string;
}

export interface Agent {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  ACTIVE: boolean;
  LEAD_COUNT?: number;
}

class BitrixAPI {
  private async request(endpoint: string, method: string = 'GET', data?: any) {
    try {
      const url = `${BASE_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1"); // Remove any double slashes
      console.log('Making request to:', url); // Debug log
      
      const response = await axios({
        method,
        url,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Bitrix API Error:', error);
      throw error;
    }
  }

  async getNewLeads() {
    const result = await this.request('crm.lead.list', 'GET', {
      filter: { ASSIGNED_BY_ID: '' },
      select: ['*', 'STAGE_ID']
    });
    
    // Fetch stage names
    const stagesResult = await this.request('crm.status.list', 'GET', {
      filter: { ENTITY_ID: 'STATUS' }
    });
    
    const stages = new Map(stagesResult.result.map((stage: any) => [stage.STATUS_ID, stage.NAME]));
    
    return result.result.map((lead: any) => ({
      ...lead,
      STAGE_NAME: stages.get(lead.STAGE_ID) || lead.STAGE_ID
    })) as Lead[];
  }

  async getActiveAgents() {
    const result = await this.request('user.get');
    return result.result as Agent[];
  }

  async getAgentDeals(agentId: string, limit: number = 10) {
    const result = await this.request('crm.deal.list', 'GET', {
      filter: { ASSIGNED_BY_ID: agentId },
      order: { DATE_CREATE: 'DESC' },
      select: ['*'],
      limit
    });
    return result.result as Deal[];
  }

  async assignLead(leadId: string, agentId: string) {
    return this.request('crm.lead.update', 'POST', {
      id: leadId,
      fields: {
        ASSIGNED_BY_ID: agentId
      }
    });
  }
}

export const bitrixApi = new BitrixAPI();