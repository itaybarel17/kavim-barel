
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

  // מיפוי בין ID של הסוכן (מהטבלה agents) למייל - עדכן בהתאם למשתמשים האמיתיים
  const getEmailByAgentId = (agentId: string): string | null => {
    // כאן תצטרך להחליף את המיילים האמיתיים של הסוכנים
    const agentEmailMap: { [key: string]: string } = {
      // דוגמאות - יש להחליף במיילים האמיתיים בהתאם ל-ID מהטבלה agents
      '37ca6d7d-4aee-4836-9a5a-70b4415315f': 'agent1@company.com',
      '4a77cdb7-a829-423c-b119-bd5ffd0c372f': 'agent2@company.com',
      '4e7b7470-e7ca-40a0-9de0-b34104ba6c3b': 'agent3@company.com',
      '5cda7e80-5699-4b5b-9c9c-41dcb027ac2a': 'agent4@company.com',
      '6463cbdc-22ca-4c0f-bf3c-794095c10ebe': 'agent5@company.com',
      '8c8ae7ad-56f7-4fc6-99d9-7f7d7d5795d4': 'agent6@company.com',
      'dbe930f9-6ff9-45cf-9842-39b44998a524': 'agent7@company.com',
      'e3229fd4-875a-44c5-90ff-a30498faf121': 'agent8@company.com',
      'e98681bc-475f-4ad4-8368-3cf59e667292': 'agent9@company.com',
      // הוסף כאן את כל הסוכנים עם המיילים שלהם
    };
    
    return agentEmailMap[agentId] || null;
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
      // חפש את המייל המתאים לסוכן לפי ה-ID שלו
      const email = getEmailByAgentId(agentId);
      
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
