import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => authService.getCurrentUser());
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem('accessToken');
        const currentUser = authService.getCurrentUser();
        return !!(currentUser && token);
    });
    const [loading] = useState(false);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
        }
        return response;
    };

    const register = async (userData) => {
        const response = await authService.register(userData);
        if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
        }
        return response;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
