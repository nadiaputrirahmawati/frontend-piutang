// composables/useDebtApi.ts
import axios, { type AxiosInstance } from 'axios';

let apiInstance: AxiosInstance | null = null;

export const useDebtApi = (): AxiosInstance => {
  if (!apiInstance) {
    const config = useRuntimeConfig();
    
    apiInstance = axios.create({
      baseURL: config.public.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Interceptor Response untuk logging error terpusat
    apiInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API Error]:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  return apiInstance;
};