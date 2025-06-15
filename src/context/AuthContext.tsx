
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  agentnumber: string;
  agentname: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (agentnumber: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkMidnightReset = () => {
    const lastLogin = localStorage.getItem('lastLoginTime');
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const now = new Date();
      
      // Check if it's past midnight since last login
      if (now.getDate() !== lastLoginDate.getDate() || 
          now.getMonth() !== lastLoginDate.getMonth() || 
          now.getFullYear() !== lastLoginDate.getFullYear()) {
        // If it's a new day, clear the auth and force re-login
        localStorage.removeItem('authUser');
        localStorage.removeItem('lastLoginTime');
        setUser(null);
        return true; // Reset occurred
      }
    }
    return false; // No reset needed
  };

  useEffect(() => {
    // Initial load - check for existing user
    const storedUser = localStorage.getItem('authUser');
    
    // First check if we need to reset due to midnight
    const wasReset = checkMidnightReset();
    
    if (!wasReset && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
    
    // Set up interval to check for midnight reset every minute
    const interval = setInterval(() => {
      checkMidnightReset();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const login = (agentnumber: string) => {
    // Hard-coded agents: 1=יניב (רגיל), 4=משרד (מנהל)
    let agentname = '';
    if (agentnumber === '1') agentname = 'יניב';
    else if (agentnumber === '4') agentname = 'משרד';
    else agentname = 'סוכן אחר';
    
    const current = { agentnumber, agentname };
    setUser(current);
    localStorage.setItem('authUser', JSON.stringify(current));
    localStorage.setItem('lastLoginTime', new Date().toISOString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('lastLoginTime');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
