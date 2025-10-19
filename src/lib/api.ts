const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || 'Request failed');
        }

        return response.json();
    }

    // Auth endpoints
    async sendOTP(phone: string, purpose: 'login' | 'registration' = 'login') {
        return this.request('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, purpose }),
        });
    }

    async verifyOTP(phone: string, otp: string, userData?: {
        name?: string;
        dateOfBirth?: string;
        gender?: string;
    }) {
        const response = await this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp, ...userData }),
        });

        if (response.data?.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async resendOTP(phone: string) {
        return this.request('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    async logout() {
        this.setToken(null);
    }

    // User endpoints
    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(profileData: {
        name?: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: string;
    }) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async updatePreferences(preferences: {
        theme?: string;
        language?: string;
        notifications?: {
            reminders?: boolean;
            healthTips?: boolean;
            updates?: boolean;
        };
    }) {
        return this.request('/users/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    async addMedicalHistory(entry: {
        condition: string;
        diagnosedDate?: string;
        notes?: string;
    }) {
        return this.request('/users/medical-history', {
            method: 'POST',
            body: JSON.stringify(entry),
        });
    }

    async addAllergy(allergy: {
        allergen: string;
        severity: 'mild' | 'moderate' | 'severe';
        notes?: string;
    }) {
        return this.request('/users/allergies', {
            method: 'POST',
            body: JSON.stringify(allergy),
        });
    }

    async removeMedicalHistory(index: number) {
        return this.request(`/users/medical-history/${index}`, {
            method: 'DELETE',
        });
    }

    async removeAllergy(index: number) {
        return this.request(`/users/allergies/${index}`, {
            method: 'DELETE',
        });
    }

    // Reminder endpoints
    async getReminders(params?: { active?: boolean; date?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.active !== undefined) queryParams.append('active', params.active.toString());
        if (params?.date) queryParams.append('date', params.date);

        const query = queryParams.toString();
        return this.request(`/reminders${query ? `?${query}` : ''}`);
    }

    async getReminder(id: string) {
        return this.request(`/reminders/${id}`);
    }

    async createReminder(reminder: {
        medicine: string;
        dosage: { amount: string; unit: string };
        time: string;
        frequency: string;
        startDate: string;
        endDate?: string;
        instructions?: string;
    }) {
        return this.request('/reminders', {
            method: 'POST',
            body: JSON.stringify(reminder),
        });
    }

    async updateReminder(id: string, updates: any) {
        return this.request(`/reminders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteReminder(id: string) {
        return this.request(`/reminders/${id}`, {
            method: 'DELETE',
        });
    }

    async completeDose(id: string, data: {
        date: string;
        time: string;
        notes?: string;
    }) {
        return this.request(`/reminders/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async missDose(id: string, data: {
        date: string;
        time: string;
        reason?: string;
    }) {
        return this.request(`/reminders/${id}/miss`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async toggleReminder(id: string, isActive: boolean) {
        return this.request(`/reminders/${id}/toggle`, {
            method: 'PUT',
            body: JSON.stringify({ isActive }),
        });
    }

    // Medicine endpoints
    async searchMedicines(params?: {
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return this.request(`/medicines${query ? `?${query}` : ''}`);
    }

    async getMedicine(id: string) {
        return this.request(`/medicines/${id}`);
    }

    async getMedicineCategories() {
        return this.request('/medicines/categories/list');
    }

    async getPopularMedicines(limit?: number) {
        const query = limit ? `?limit=${limit}` : '';
        return this.request(`/medicines/popular${query}`);
    }

    // Symptom endpoints
    async searchSymptoms(params?: {
        search?: string;
        category?: string;
        severity?: string;
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.severity) queryParams.append('severity', params.severity);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return this.request(`/symptoms${query ? `?${query}` : ''}`);
    }

    async getSymptom(id: string) {
        return this.request(`/symptoms/${id}`);
    }

    async getSymptomCategories() {
        return this.request('/symptoms/categories/list');
    }

    async getCommonSymptoms(limit?: number) {
        const query = limit ? `?limit=${limit}` : '';
        return this.request(`/symptoms/common${query}`);
    }

    async checkSymptoms(symptoms: string[]) {
        return this.request('/symptoms/check', {
            method: 'POST',
            body: JSON.stringify({ symptoms }),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
