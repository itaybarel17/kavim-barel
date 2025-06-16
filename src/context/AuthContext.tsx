
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  agentnumber: string;
  agentname: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (agentnumber: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
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

  const login = async (agentnumber: string, password: string): Promise<boolean> => {
    try {
      // Get agent details first - query with string agentnumber
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .eq('agentnumber', agentnumber) // Use string directly, no parseInt
        .single();

      if (agentError || !agent) {
        console.log('Agent not found:', agentnumber);
        return false;
      }

      // Use the new encrypted password verification function
      const { data: isPasswordValid, error: passwordError } = await supabase
        .rpc('verify_agent_password', {
          agent_number: agentnumber, // Pass as string
          input_password: password
        });

      if (passwordError) {
        console.error('Password verification error:', passwordError);
        return false;
      }

      if (isPasswordValid) {
        const currentUser = { 
          agentnumber: agent.agentnumber, // Already a string from database
          agentname: agent.agentname 
        };
        
        setUser(currentUser);
        localStorage.setItem('authUser', JSON.stringify(currentUser));
        localStorage.setItem('lastLoginTime', new Date().toISOString());
        
        console.log('Login successful for:', agent.agentname);
        return true;
      } else {
        console.log('Password mismatch');
        return false;
      }

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
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
