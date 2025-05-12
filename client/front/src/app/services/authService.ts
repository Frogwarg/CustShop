import axios, { AxiosRequestConfig } from 'axios';

// const API_URL = 'http://localhost:5123/api';
const API_URL = '/api';

export interface LoginRequest {
  email: string;
  password: string;
  sessionId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  sessionId?: string;
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
    const response = await axios.post(`${API_URL}/auth/login`, data, {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true, // Отправляем куки
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Отправляем куки
        });
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
  setToken(token: string, expiration: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
  },

  getToken(): string | null {
    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('tokenExpiration');
    if (token && expiration && new Date(expiration) > new Date()) {
      return token;
    }
    this.logout();
    return null;
  },
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },
  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Ошибка обновления токена:", error);
      return null;
    }
  },

  // Утилита для выполнения авторизованных запросов с обновлением токена
  async fetchWithRefresh(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const newTokenData = await this.refreshToken();
      if (newTokenData) {
        headers.Authorization = `Bearer ${newTokenData.token}`;
        response = await fetch(url, { ...options, headers });
      } else {
        this.logout();
        throw new Error("Токен истёк, требуется повторный вход");
      }
    }

    return response;
  },
  async axiosWithRefresh<T, D = unknown>(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: D, config: AxiosRequestConfig = {}): Promise<T> {
    const token = this.getToken();
    const requestConfig: AxiosRequestConfig = {
      method,
      url: `${API_URL}${url}`,
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        ...config.headers,
      },
      data,
      withCredentials: true,
      ...config,
    };

    try {
      const response = await axios(requestConfig);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newTokenData = await this.refreshToken();
        if (newTokenData) {
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers.Authorization = `Bearer ${newTokenData.token}`;
          const retryResponse = await axios(requestConfig);
          return retryResponse.data;
        } else {
          this.logout();
          throw new Error('Токен истёк, требуется повторный вход');
        }
      }
      throw error;
    }
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
  },
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
  }
};

export default authService;