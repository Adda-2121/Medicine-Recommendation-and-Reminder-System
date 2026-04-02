import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to authenticate stored token:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      const { name, email, password, role, phone_number, document, selfie, license_number, license_issuing_authority, license_expiry_date } = userData;
      let data = { name, email, password, role, phone_number };
      let headers = { 'Content-Type': 'application/json' };

      if (role === 'doctor') {
        data = new FormData();
        data.append('name', name);
        data.append('email', email);
        data.append('password', password);
        data.append('role', role);
        if (phone_number) data.append('phone_number', phone_number);
        data.append('license_number', license_number);
        data.append('license_issuing_authority', license_issuing_authority);
        data.append('license_expiry_date', license_expiry_date);
        
        if (document) data.append('document', document);
        if (selfie) data.append('selfie', selfie);
        
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      const res = await api.post('/auth/register', data, { headers });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const forgotPassword = async (method, identifier) => {
    try {
      const res = await api.post('/auth/forgotpassword', { method, identifier });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to send reset request';
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      const res = await api.put(`/auth/resetpassword/${resetToken}`, { password });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to reset password';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
