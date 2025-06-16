
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Agent {
  id: string;
  agentname: string;
  agentnumber: string;
}

// Group agents by category for better organization
const getCategoryFromAgentNumber = (agentnumber: string) => {
  if (agentnumber === "4") return "ניהול";
  if (agentnumber === "99") return "מיוחד";
  return "מכירות";
};

export default function Auth() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Fetch agents from database
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('id, agentname, agentnumber')
          .order('agentnumber');

        if (error) {
          console.error('Error fetching agents:', error);
          setError('שגיאה בטעינת רשימת הסוכנים');
        } else {
          setAgents(data || []);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('שגיאה בטעינת רשימת הסוכנים');
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.agentnumber === "4") {
        navigate("/distribution", { replace: true });
      } else {
        navigate("/calendar", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      setError("נא לבחור סוכן");
      return;
    }

    if (!password) {
      setError("נא להזין סיסמה");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const selectedAgentData = agents.find(agent => agent.id === selectedAgent);
      if (!selectedAgentData) {
        setError("סוכן לא נמצא");
        setIsLoading(false);
        return;
      }

      const success = await login(selectedAgentData.id, password);
      if (!success) {
        setError("שם משתמש או סיסמה שגויים");
      }
    } catch (err) {
      setError("שגיאה בהתחברות. נסה שוב.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  // Group agents by category
  const agentsByCategory = agents.reduce((acc, agent) => {
    const category = getCategoryFromAgentNumber(agent.agentnumber);
    if (!acc[category]) acc[category] = [];
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  if (isLoadingAgents) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען רשימת סוכנים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">
              התחברות למערכת ההפצה
            </CardTitle>
            <CardDescription className="text-gray-600">
              בחר סוכן והכנס פרטי התחברות
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent-select" className="text-sm font-medium text-gray-700">
                  בחירת סוכן
                </Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full h-12 text-right">
                    <SelectValue placeholder="בחר סוכן..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(agentsByCategory).map(([category, categoryAgents]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                          {category}
                        </div>
                        {categoryAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id} className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{agent.agentname}</span>
                              <span className="text-sm text-gray-500">סוכן {agent.agentnumber}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAgent && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    סיסמה
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="הכנס סיסמה..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-right"
                    dir="rtl"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={!selectedAgent || !password || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    מתחבר...
                  </div>
                ) : (
                  selectedAgentData ? `התחבר כ${selectedAgentData.agentname}` : "התחבר"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
