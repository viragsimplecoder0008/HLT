import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4`;

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  accessToken?: string;
}

let backendAvailable: boolean | null = null;

// Check if the backend is deployed and available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    return response.ok;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
}

export function isBackendAvailable(): boolean | null {
  return backendAvailable;
}

export async function apiRequest(endpoint: string, options: FetchOptions = {}) {
  const { method = 'GET', body, accessToken } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Use access token if provided, otherwise use anon key
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`API Request: ${method} ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`API Response: ${response.status} ${response.statusText}`);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('API request timeout');
      throw new Error('Request timeout - backend might not be deployed');
    }
    console.error('API request failed:', error);
    throw error;
  }
}
