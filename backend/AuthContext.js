// src/context/AuthContext.js
    import React, { createContext, useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom'; // Import useNavigate

    // Create the AuthContext
    export const AuthContext = createContext();

    // Create the AuthProvider component
    export const AuthProvider = ({ children }) => {
        // State to hold the authentication token and user role
        const [token, setToken] = useState(localStorage.getItem('token'));
        const [role, setRole] = useState(localStorage.getItem('role'));
        const navigate = useNavigate(); // Initialize useNavigate hook

        // Effect to update localStorage when token or role changes
        useEffect(() => {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
            if (role) {
                localStorage.setItem('role', role);
            } else {
                localStorage.removeItem('role');
            }
        }, [token, role]);

        // Login function
        const login = (newToken, newRole) => {
            setToken(newToken);
            setRole(newRole);
            // Navigate based on role after login
            if (newRole === 'librarian') {
                navigate('/librarian');
            } else if (newRole === 'student') {
                navigate('/student');
            } else {
                navigate('/'); // Default to home if role is unknown
            }
        };

        // Logout function
        const logout = () => {
            setToken(null);
            setRole(null);
            // Clear local storage immediately
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            navigate('/librarian/login'); // Redirect to login page after logout
        };

        // The value provided to consumers of this context
        const authContextValue = {
            token,
            role,
            login,
            logout,
            isAuthenticated: !!token // Convenience boolean
        };

        return (
            <AuthContext.Provider value={authContextValue}>
                {children}
            </AuthContext.Provider>
        );
    };
    