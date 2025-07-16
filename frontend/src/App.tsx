// Main application for SwarnaAI real-time precious metals dashboard
import React from 'react';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const { user, updatePreferences } = useAuth();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updatePreferences({ theme });
  };

  return (
    <ThemeProvider 
      userTheme={user?.preferences?.theme} 
      onThemeChange={handleThemeChange}
    >
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
