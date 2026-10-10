import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { Platform } from "react-native"

// Define API response type
export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
  headers: any
}

// Create API client class
class ApiClient {
  private client: AxiosInstance
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.API_URL || "https://api.fitness-app.com"

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Platform": Platform.OS,
        "X-App-Version": process.env.APP_VERSION || "1.0.0",
      },
    })

    // Add request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        // Get token from storage
        const token = this.getAuthToken()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => Promise.reject(error),
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle specific error cases
        if (error.response) {
          // Handle 401 Unauthorized
          if (error.response.status === 401) {
            // Clear auth token and redirect to login
            this.clearAuthToken()
            // Redirect logic would be handled by the app navigation
          }

          // Handle 429 Too Many Requests
          if (error.response.status === 429) {
            // Implement retry logic with exponential backoff
            return this.retryRequest(error.config)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  // Get auth token from secure storage
  private getAuthToken(): string | null {
    // In a real app, this would use secure storage
    // For now, we'll use localStorage as a placeholder
    return localStorage.getItem("authToken")
  }

  // Clear auth token
  private clearAuthToken(): void {
    localStorage.removeItem("authToken")
  }

  // Retry request with exponential backoff
  private async retryRequest(config: AxiosRequestConfig, retryCount = 0): Promise<AxiosResponse> {
    const maxRetries = 3
    const delayMs = Math.pow(2, retryCount) * 1000 // Exponential backoff

    if (retryCount >= maxRetries) {
      return Promise.reject(new Error("Maximum retry attempts reached"))
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))

    return this.client(config).catch((error) => this.retryRequest(config, retryCount + 1))
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client(config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }
    } catch (error) {
      throw error
    }
  }

  // GET method
  public async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.request<T>({
      method: "GET",
      url,
      params,
    })
    return response.data
  }

  // POST method
  public async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.request<T>({
      method: "POST",
      url,
      data,
    })
    return response.data
  }

  // PUT method
  public async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.request<T>({
      method: "PUT",
      url,
      data,
    })
    return response.data
  }

  // PATCH method
  public async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.request<T>({
      method: "PATCH",
      url,
      data,
    })
    return response.data
  }

  // DELETE method
  public async delete<T>(url: string): Promise<T> {
    const response = await this.request<T>({
      method: "DELETE",
      url,
    })
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
