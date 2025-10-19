import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/lib/api';

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    medicalHistory?: Array<{
        condition: string;
        diagnosedDate?: string;
        notes?: string;
    }>;
    allergies?: Array<{
        allergen: string;
        severity: string;
        notes?: string;
    }>;
    preferences?: {
        theme: string;
        notifications: {
            reminders: boolean;
            healthTips: boolean;
            updates: boolean;
        };
        language: string;
    };
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sendOTP: (phone: string, purpose?: 'login' | 'registration') => Promise<void>;
    verifyOTP: (phone: string, otp: string, userData?: {
        name?: string;
        dateOfBirth?: string;
        gender?: string;
    }) => Promise<void>;
    resendOTP: (phone: string) => Promise<void>;
    logout: () => void;
    updateProfile: (profileData: any) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const response = await apiClient.getProfile();
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    localStorage.removeItem('auth_token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const sendOTP = async (phone: string, purpose: 'login' | 'registration' = 'login') => {
        try {
            await apiClient.sendOTP(phone, purpose);
        } catch (error) {
            throw error;
        }
    };

    const verifyOTP = async (phone: string, otp: string, userData?: {
        name?: string;
        dateOfBirth?: string;
        gender?: string;
    }) => {
        try {
            const response = await apiClient.verifyOTP(phone, otp, userData);
            setUser(response.data.user);
        } catch (error) {
            throw error;
        }
    };

    const resendOTP = async (phone: string) => {
        try {
            await apiClient.resendOTP(phone);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        apiClient.logout();
        setUser(null);
    };

    const updateProfile = async (profileData: any) => {
        try {
            const response = await apiClient.updateProfile(profileData);
            setUser(response.data.user);
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async () => {
        try {
            const response = await apiClient.getProfile();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to refresh user:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        sendOTP,
        verifyOTP,
        resendOTP,
        logout,
        updateProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
