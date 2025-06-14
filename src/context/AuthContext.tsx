
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  agentnumber: string;
  agentname: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (agentnumber: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) setUser(JSON.parse(storedUser));
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
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
