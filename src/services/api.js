import axios from 'axios';

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                try {
                    const needsToken = config.token === true;
                    if (needsToken) {
                        try {
                            const jwtResponse = await axios.get(`/api/jwt`).then((response) => response.data);
                            if (jwtResponse && jwtResponse.jwt) {
                                config.headers.Authorization = `Bearer ${jwtResponse.jwt}`;
                                console.log('JWT token added to request:', config.url);
                            } else {
                                console.warn('No JWT token available for endpoint:', config.url);
                            }
                        } catch (jwtError) {
                            console.warn('JWT Service failed for endpoint:', config.url, jwtError.message);
                            // For protected endpoints, we might want to redirect to login
                            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                                console.warn('Redirecting to login due to authentication failure');
                            }
                        }
                    } else {
                        console.log('No token required for endpoint:', config.url);
                    }

                    // Remove the token flag from config to avoid sending it to server
                    delete config.token;
                } catch (error) {
                    console.error('Error in request interceptor:', error);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => {
                return response.data;
            },
            (error) => {
                console.error('API Request Error:', error);
                const message = error.response?.data?.message || error.message || 'API request failed';
                throw new Error(message);
            }
        );
    }



    // Generic request method
    async request(endpoint, options = {}) {
        try {
            const response = await this.axiosInstance.request({
                url: endpoint,
                ...options,
            });
            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options,
        });
    }

    // POST request
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            data: data,
            ...options,
        });
    }

    // PUT request
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            data: data,
            ...options,
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options,
        });
    }

    // PATCH request
    async patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            data: data,
            ...options,
        });
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;