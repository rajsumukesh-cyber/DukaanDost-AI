import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { TRANSLATIONS } from '../i18n/translations';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dukaanbot_token') || null);
  const [language, setLanguage] = useState(localStorage.getItem('dukaanbot_lang') || 'en');
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setShop(data.shop);
          if (data.user?.language) {
            setLanguage(data.user.language);
          }
        } catch (err) {
          console.warn("Session check failed:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (phone, password) => {
    const data = await api.login(phone, password);
    localStorage.setItem('dukaanbot_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setShop(data.shop);
    if (data.user?.language) {
      changeLanguage(data.user.language);
    }
    return data;
  };

  const register = async (signupData) => {
    const data = await api.register(signupData);
    localStorage.setItem('dukaanbot_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setShop(data.shop);
    if (signupData.language_preference) {
      changeLanguage(signupData.language_preference);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('dukaanbot_token');
    setToken(null);
    setUser(null);
    setShop(null);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('dukaanbot_lang', lang);
  };

  const updateShopState = (updatedShop) => {
    setShop(updatedShop);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        token,
        language,
        t,
        loading,
        login,
        register,
        logout,
        changeLanguage,
        updateShopState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
