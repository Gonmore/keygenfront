// lib/api.ts
import axios from 'axios';

const API_URL = process.env.KEYGEN_API_URL || 'http://localhost:3000';
const ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID;
const TOKEN = process.env.KEYGEN_ADMIN_TOKEN;

// Cliente preconfigurado para comunicarse con tu instancia de Keygen
export const keygenApi = axios.create({
  baseURL: `${API_URL}/v1/accounts/${ACCOUNT_ID}`,
  headers: {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Authorization': `Bearer ${TOKEN}`,
  },
});

// Helper de utilidad para formatear los datos de envío según el estándar JSON:API
export const formatJsonApi = (
  type: string, 
  attributes?: Record<string, any>, 
  relationships?: Record<string, any>
) => {
  const payload: any = {
    data: {
      type,
    }
  };

  if (attributes && Object.keys(attributes).length > 0) {
    payload.data.attributes = attributes;
  }

  if (relationships && Object.keys(relationships).length > 0) {
    payload.data.relationships = {};
    for (const [relName, relData] of Object.entries(relationships)) {
      payload.data.relationships[relName] = {
        data: relData
      };
    }
  }

  return payload;
};