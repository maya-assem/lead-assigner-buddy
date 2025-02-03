import axios from 'axios';

const BASE_URL = 'https://diet-hub.bitrix24.com/rest/1/q5iy1s9aemfpc1j1';

export interface Lead {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
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
      const response = await axios({
        method,
        url: `${BASE_URL}/${endpoint}`,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Bitrix API Error:', error);
      throw error;
    }
  }

  async getNewLeads() {
    const result = await this.request('crm.lead.list');
    return result.result as Lead[];
  }

  async getActiveAgents() {
    const result = await this.request('user.get');
    return result.result as Agent[];
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