
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  agentnumber: string;
  agentname: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (agentId: string, password: string) => Promise<boolean>;
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
  const [session, setSession] = useState<Session | null>(null);

  const fetchAgentData = async (userId: string) => {
    try {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .eq('id', userId)
        .single();

      if (error || !agent) {
        console.error('Error fetching agent data:', error);
        return null;
      }

      return {
        agentnumber: agent.agentnumber,
        agentname: agent.agentname
      };
    } catch (error) {
      console.error('Error fetching agent data:', error);
      return null;
    }
  };

  const findUserEmailByAgentId = async (agentId: string) => {
    try {
      // Get all auth users and find the one that matches our agent ID
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error fetching auth users:', error);
        return null;
      }

      // Find user whose ID matches the agent ID
      const matchingUser = users?.find(user => user.id === agentId);
      return matchingUser?.email || null;
    } catch (error) {
      console.error('Error finding user email:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer agent data fetching to prevent deadlocks
          setTimeout(async () => {
            const agentData = await fetchAgentData(session.user.id);
            if (agentData) {
              setUser(agentData);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAgentData(session.user.id).then((agentData) => {
          if (agentData) {
            setUser(agentData);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (agentId: string, password: string): Promise<boolean> => {
    try {
      // First, find the email associated with this agent ID
      const email = await findUserEmailByAgentId(agentId);
      
      if (!email) {
        console.log('No email found for agent ID:', agentId);
        return false;
      }

      console.log('Attempting login with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.log('Login error:', error.message);
        return false;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
