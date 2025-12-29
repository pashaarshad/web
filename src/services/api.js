import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = Cookies.get('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data.data;
                    Cookies.set('accessToken', accessToken, { expires: 7 });

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    addAddress: (data) => api.post('/users/addresses', data),
    updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
    getFavorites: () => api.get('/users/favorites'),
    addFavorite: (id) => api.post(`/users/favorites/${id}`),
    removeFavorite: (id) => api.delete(`/users/favorites/${id}`),
};

export const restaurantAPI = {
    getAll: (params) => api.get('/restaurants', { params }),
    getFeatured: () => api.get('/restaurants/featured'),
    getById: (id) => api.get(`/restaurants/${id}`),
    getMenu: (id) => api.get(`/restaurants/${id}/menu`),
    getCuisines: () => api.get('/restaurants/cuisines'),
};

export const orderAPI = {
    create: (data) => api.post('/orders', data),
    getMyOrders: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    track: (id) => api.get(`/orders/${id}/track`),
    cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
    verifyPayment: (id, data) => api.post(`/orders/${id}/verify-payment`, data),

    // Restaurant specific
    getRestaurantOrders: (params) => api.get('/orders/restaurant/orders', { params }),
    getRestaurantStats: () => api.get('/orders/restaurant/stats'),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    verifyPayment: (id, data) => api.post(`/orders/${id}/verify-payment`, data),

    // Driver specific
    getDriverOrders: (params) => api.get('/orders/driver/orders', { params }),
    getAvailableOrders: (params) => api.get('/orders/driver/available', { params }),
    acceptOrder: (id) => api.post(`/orders/${id}/accept`),
};
