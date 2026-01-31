import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import api from '../utils/api';

export interface User {
    id: number; // Added user ID for chat
    address: string;
    username: string;
    isVerified: boolean;
    email?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isWalletConnected: boolean;
    login: () => Promise<void>;
    debugLog: string;
    logout: () => void;
    verifyEmail: (email: string, code?: string) => Promise<void>;
    sendVerificationCode: (email: string) => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [debugLog, setDebugLog] = useState<string>('');

    // Login function to be called manually by "Check Status" button
    const login = async () => {
        if (isConnected && address) {
            try {
                setIsLoading(true);
                setDebugLog('Manual login initiated with wallet: ' + address);

                // 1. Call login API
                const loginUrl = '/auth/login';
                setDebugLog(prev => prev + '\nPOST ' + loginUrl);

                const response = await api.post(loginUrl, { wallet_address: address });
                setDebugLog(prev => prev + '\nResponse: ' + JSON.stringify(response.data));

                // Robust extraction: Check response.data.token OR response.data.data.token
                const responseData = response.data?.data || response.data;
                const token = responseData?.token;
                const userData = responseData?.user;

                if (token) {
                    localStorage.setItem('auth_token', token);
                    setDebugLog(prev => prev + '\nToken saved to localStorage');

                    // Directly set user state if available in response
                    if (userData) {
                        setUser({
                            id: userData.id, // Extract ID
                            address: userData.wallet_address,
                            username: `${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)} `,
                            isVerified: userData.is_verified,
                            email: userData.email,
                            // map other fields if necessary
                        });
                        setDebugLog(prev => prev + '\nUser state updated from login response (ID: ' + userData.id + ')');
                    } else {
                        // Fallback if user object is not in login response
                        await fetchUserProfile();
                    }
                } else {
                    throw new Error('No token found in response: ' + JSON.stringify(response.data));
                }
            } catch (error: any) {
                console.error('Login failed:', error);
                let errorMsg = 'Login Error: ' + (error.message || 'Unknown error');
                if (error.response) {
                    errorMsg += '\nServer responded with: ' + error.response.status;
                    errorMsg += '\nData: ' + JSON.stringify(error.response.data);
                } else if (error.request) {
                    errorMsg += '\nNo response received from server at ' + api.defaults.baseURL;
                }
                setDebugLog(prev => prev + '\n' + errorMsg);
            } finally {
                setIsLoading(false);
            }
        } else {
            setDebugLog('Cannot login: Wallet not connected');
        }
    };

    /* 
    // Removed automatic login effect based on user request
    useEffect(() => {
        const loginWithWallet = async () => {
            if (isConnected && address) {
                try {
                    setIsLoading(true);
                    setDebugLog('Initiating login with wallet: ' + address);

                    // 1. Call login API
                    const loginUrl = '/auth/login';
                    setDebugLog(prev => prev + '\nPOST ' + loginUrl);

                    const response = await api.post(loginUrl, { wallet_address: address });
                    setDebugLog(prev => prev + '\nResponse: ' + JSON.stringify(response.data));

                    // Robust extraction: Check response.data.token OR response.data.data.token
                    const token = response.data?.token || response.data?.data?.token;

                    if (token) {
                        localStorage.setItem('auth_token', token);
                        setDebugLog(prev => prev + '\nToken saved to localStorage');
                        // 2. Fetch user profile
                        await fetchUserProfile();
                    } else {
                        throw new Error('No token found in response: ' + JSON.stringify(response.data));
                    }
                } catch (error: any) {
                    console.error('Login failed:', error);
                    let errorMsg = 'Login Error: ' + (error.message || 'Unknown error');
                    if (error.response) {
                        errorMsg += '\nServer responded with: ' + error.response.status;
                        errorMsg += '\nData: ' + JSON.stringify(error.response.data);
                    } else if (error.request) {
                        errorMsg += '\nNo response received from server at ' + api.defaults.baseURL;
                    }
                    setDebugLog(prev => prev + '\n' + errorMsg);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Not connected, specific mocked user cleanup if needed
                setUser(null);
                setDebugLog('Wallet not connected.');
            }
        };

        loginWithWallet();
    }, [isConnected, address]); 
    */

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data && response.data.data) {
                const userData = response.data.data;
                setUser({
                    id: userData.id, // Extract ID
                    address: userData.wallet_address,
                    username: `${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)} `,
                    isVerified: userData.is_verified,
                    email: userData.email
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    // Check for existing token on mount (if user refreshes but wallet is still connected)
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token && isConnected) {
            setIsLoading(true);
            fetchUserProfile().finally(() => setIsLoading(false));
        }
    }, [isConnected]);



    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        disconnect();
    };

    const sendVerificationCode = async (email: string) => {
        setIsLoading(true);
        try {
            await api.post('/auth/send-code', { email });
        } catch (error) {
            console.error('Failed to send code:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (email: string, code?: string) => {
        if (!code) {
            // Overloaded for backward compatibility or different usage, but here assume code is required for final verification
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/verify-email', { code });
            // Refresh profile to update verified status
            await fetchUserProfile();
        } catch (error) {
            console.error('Verification failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isWalletConnected: isConnected,
            login,
            logout,
            verifyEmail,
            sendVerificationCode,
            isLoading,
            debugLog
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
