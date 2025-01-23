import axios from 'axios';

const API_URL = 'http://localhost:5123/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
}

const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await axios.post(`${API_URL}/auth/forgot-password`, JSON.stringify(email));
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    await axios.post(`${API_URL}/auth/reset-password`, {
      email,
      token,
      newPassword
    });
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Декодируем JWT для получения ролей
  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [];
  },

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
};

export default authService;