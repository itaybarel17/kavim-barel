
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
      console.log('=== Starting login process ===');
      console.log('Agent number:', agentnumber, 'Type:', typeof agentnumber);
      console.log('Password:', password, 'Type:', typeof password);
      
      // First, let's test basic connection to Supabase
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('agents')
        .select('count');

      console.log('Connection test result:', testData, 'Error:', testError);

      // Now let's try to get all agents to see what's in the table
      console.log('Fetching all agents from database...');
      const { data: allAgents, error: allError } = await supabase
        .from('agents')
        .select('*');

      console.log('All agents result:', allAgents, 'Error:', allError);
      console.log('Number of agents found:', allAgents?.length || 0);

      if (allAgents && allAgents.length > 0) {
        console.log('Sample agent:', allAgents[0]);
        console.log('Agent numbers in DB:', allAgents.map(a => a.agentnumber));
      }

      // Now try to find our specific agent
      console.log('Looking for agent with number:', agentnumber);
      const { data: specificAgent, error: specificError } = await supabase
        .from('agents')
        .select('agentnumber, agentname, password_onlyview')
        .eq('agentnumber', agentnumber);

      console.log('Specific agent query result:', specificAgent, 'Error:', specificError);

      if (!specificAgent || specificAgent.length === 0) {
        console.log('No agent found with exact match. Trying alternative search...');
        
        // Try to find by manual comparison
        const foundAgent = allAgents?.find(agent => {
          console.log(`Comparing "${agent.agentnumber}" with "${agentnumber}"`);
          return agent.agentnumber === agentnumber || 
                 agent.agentnumber.toString() === agentnumber.toString() ||
                 parseInt(agent.agentnumber) === parseInt(agentnumber);
        });

        if (foundAgent) {
          console.log('Found agent through manual comparison:', foundAgent);
          
          // Check password
          const storedPassword = foundAgent.password_onlyview?.toString().trim();
          const inputPassword = password.toString().trim();
          
          console.log('Password comparison:', {
            stored: storedPassword,
            input: inputPassword,
            match: storedPassword === inputPassword
          });

          if (storedPassword === inputPassword) {
            const currentUser = { 
              agentnumber: foundAgent.agentnumber, 
              agentname: foundAgent.agentname 
            };
            
            setUser(currentUser);
            localStorage.setItem('authUser', JSON.stringify(currentUser));
            localStorage.setItem('lastLoginTime', new Date().toISOString());
            
            console.log('Login successful for:', foundAgent.agentname);
            return true;
          } else {
            console.log('Password mismatch');
            return false;
          }
        } else {
          console.log('Agent not found through any method');
          return false;
        }
      } else {
        // Found agent through direct query
        const agent = specificAgent[0];
        console.log('Found agent through direct query:', agent);
        
        const storedPassword = agent.password_onlyview?.toString().trim();
        const inputPassword = password.toString().trim();
        
        console.log('Password comparison:', {
          stored: storedPassword,
          input: inputPassword,
          match: storedPassword === inputPassword
        });

        if (storedPassword === inputPassword) {
          const currentUser = { 
            agentnumber: agent.agentnumber, 
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
