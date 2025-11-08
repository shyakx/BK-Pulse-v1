import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptor for token
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.getMe();
          if (response.user) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.user,
                token: token
              }
            });
          } else {
            throw new Error('Invalid user data');
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.login(email, password);
      
      if (response.user && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.user, token: response.token }
        });
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed - invalid response');
      }
    } catch (error) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!state.user) return false;
    return state.user.role === requiredRole;
  }, [state.user]);

  const hasAnyRole = useCallback((roles) => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  }, [state.user]);

  const value = {
    ...state,
    login,
    logout,
    clearError,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
