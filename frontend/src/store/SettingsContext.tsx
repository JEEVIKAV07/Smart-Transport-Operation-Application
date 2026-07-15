import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('transitops_theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('transitops_notifications');
    return saved ? saved === 'true' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('transitops_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('transitops_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('transitops_notifications', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);

  return (
    <SettingsContext.Provider value={{ isDarkMode, toggleDarkMode, notificationsEnabled, toggleNotifications }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
