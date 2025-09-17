// API Service with automatic token refresh and error handling

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

class ApiService {
  private baseURL: string;
  private getValidToken: (() => Promise<string | null>) | null = null;
  private logout: (() => void) | null = null;
  private refreshToken: (() => Promise<boolean>) | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
  }

  // Set auth methods from AuthContext
  setAuthMethods(
    getValidToken: () => Promise<string | null>,
    logout: () => void,
    refreshToken: () => Promise<boolean>
  ) {
    this.getValidToken = getValidToken;
    this.logout = logout;
    this.refreshToken = refreshToken;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.getValidToken) {
      const token = await this.getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse response',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, retryCount = 0, ...requestConfig } = config;
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Prepare headers
      let headers = { ...requestConfig.headers };
      
      if (!skipAuth) {
        const authHeaders = await this.getAuthHeaders();
        headers = { ...headers, ...authHeaders };
      }

      console.log(`🚀 API Request: ${requestConfig.method || 'GET'} ${endpoint}`);

      const response = await fetch(url, {
        ...requestConfig,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && !skipAuth) {
        console.log('🔒 401 Unauthorized - attempting token refresh...');
        
        // Only retry once to avoid infinite loops
        if (retryCount === 0 && this.refreshToken) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('🔄 Token refreshed, retrying request...');
            return this.makeRequest(endpoint, { ...config, retryCount: 1 });
          }
        }
        
        // If refresh failed or already retried, logout user
        console.log('❌ Token refresh failed, logging out...');
        if (this.logout) {
          this.logout();
        }
        
        return {
          success: false,
          message: 'Session expired. Please login again.',
          error: 'UNAUTHORIZED'
        };
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await this.handleResponse(response);
        console.log(`❌ API Error: ${response.status} ${response.statusText}`, errorData);
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          error: `HTTP_${response.status}`
        };
      }

      const result = await this.handleResponse<T>(response);
      console.log(`✅ API Success: ${requestConfig.method || 'GET'} ${endpoint}`);
      return result;

    } catch (error) {
      console.error(`💥 API Network Error: ${requestConfig.method || 'GET'} ${endpoint}`, error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error instanceof Error ? error.message : 'NETWORK_ERROR'
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Convenience methods for common endpoints
  
  // Auth endpoints
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password }, { skipAuth: true });
  }

  async refreshTokens(refreshToken: string) {
    return this.post('/auth/refresh', { refreshToken }, { skipAuth: true });
  }

  async getProfile() {
    return this.get('/auth/me');
  }

  async logout() {
    return this.post('/auth/logout');
  }

  // Dashboard
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentActivity(limit?: number) {
    const endpoint = limit ? `/dashboard/recent-activity?limit=${limit}` : '/dashboard/recent-activity';
    return this.get(endpoint);
  }

  // Clients
  async getClients(params?: URLSearchParams) {
    const endpoint = params ? `/clients?${params.toString()}` : '/clients';
    return this.get(endpoint);
  }

  async getClient(id: string) {
    return this.get(`/clients/${id}`);
  }

  async createClient(data: any) {
    return this.post('/clients', data);
  }

  async updateClient(id: string, data: any) {
    return this.patch(`/clients/${id}`, data);
  }

  async deleteClient(id: string) {
    return this.delete(`/clients/${id}`);
  }

  // Properties
  async getProperties(params?: URLSearchParams) {
    const endpoint = params ? `/properties?${params.toString()}` : '/properties';
    return this.get(endpoint);
  }

  async getProperty(id: string) {
    return this.get(`/properties/${id}`);
  }

  async createProperty(data: any) {
    return this.post('/properties', data);
  }

  async updateProperty(id: string, data: any) {
    return this.patch(`/properties/${id}`, data);
  }

  async deleteProperty(id: string) {
    return this.delete(`/properties/${id}`);
  }

  // Leads
  async getLeads(params?: URLSearchParams) {
    const endpoint = params ? `/leads?${params.toString()}` : '/leads';
    return this.get(endpoint);
  }

  async getLead(id: string) {
    return this.get(`/leads/${id}`);
  }

  async createLead(data: any) {
    return this.post('/leads', data);
  }

  async updateLead(id: string, data: any) {
    return this.patch(`/leads/${id}`, data);
  }

  async convertLead(id: string, data?: any) {
    return this.post(`/leads/${id}/convert`, data);
  }

  // Opportunities
  async getOpportunities(params?: URLSearchParams) {
    const endpoint = params ? `/opportunities?${params.toString()}` : '/opportunities';
    return this.get(endpoint);
  }

  async getOpportunity(id: string) {
    return this.get(`/opportunities/${id}`);
  }

  async createOpportunity(data: any) {
    return this.post('/opportunities', data);
  }

  async updateOpportunity(id: string, data: any) {
    return this.patch(`/opportunities/${id}`, data);
  }

  async deleteOpportunity(id: string) {
    return this.delete(`/opportunities/${id}`);
  }

  // Transactions
  async getTransactions(params?: URLSearchParams) {
    const endpoint = params ? `/transactions?${params.toString()}` : '/transactions';
    return this.get(endpoint);
  }

  async getTransaction(id: string) {
    return this.get(`/transactions/${id}`);
  }

  async createTransaction(data: any) {
    return this.post('/transactions', data);
  }

  async updateTransaction(id: string, data: any) {
    return this.patch(`/transactions/${id}`, data);
  }

  async updateTransactionStatus(id: string, status: string) {
    return this.patch(`/transactions/${id}/status`, { status });
  }

  async deleteTransaction(id: string) {
    return this.delete(`/transactions/${id}`);
  }

  // Users/Agents
  async getUsers(params?: URLSearchParams) {
    const endpoint = params ? `/users?${params.toString()}` : '/users';
    return this.get(endpoint);
  }

  // Analytics
  async getAnalytics() {
    return this.get('/analytics');
  }

  // Settings
  async getSettings() {
    return this.get('/settings');
  }

  async updateSettings(data: any) {
    return this.patch('/settings', data);
  }

  async getExchangeRates() {
    return this.get('/settings/exchange-rates');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export type { ApiResponse };
