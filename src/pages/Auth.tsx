
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const agents = [
  // סוכני מכירות (לפי סדר agentnumber)
  { id: "1", name: "יניב", title: "סוכן מכירות", category: "מכירות" },
  { id: "2", name: "לינוי", title: "סוכן מכירות", category: "מכירות" },
  { id: "3", name: "אייל", title: "סוכן מכירות", category: "מכירות" },
  { id: "5", name: "אחמד", title: "סוכן מכירות", category: "מכירות" },
  { id: "6", name: "ג'קי", title: "סוכן מכירות", category: "מכירות" },
  { id: "7", name: "חיים", title: "סוכן מכירות", category: "מכירות" },
  { id: "8", name: "רונן", title: "סוכן מכירות", category: "מכירות" },
  // מנהל מערכת
  { id: "4", name: "משרד", title: "מנהל מערכת", category: "ניהול" },
  // סוכן מיוחד
  { id: "99", name: "קנדי", title: "סוכן מיוחד", category: "מיוחד" },
];

// Group agents by category for better organization
const agentsByCategory = {
  "מכירות": agents.filter(agent => agent.category === "מכירות"),
  "ניהול": agents.filter(agent => agent.category === "ניהול"),
  "מיוחד": agents.filter(agent => agent.category === "מיוחד"),
};

export default function Auth() {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

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
      const success = await login(selectedAgent, password);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl lg:text-2xl font-bold text-gray-800">
              התחברות למערכת ההפצה
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm lg:text-base">
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
                  <SelectTrigger className="w-full h-12 text-right" dir="rtl">
                    <SelectValue placeholder="בחר סוכן..." />
                  </SelectTrigger>
                  <SelectContent 
                    side="bottom" 
                    align="start" 
                    className="w-full min-w-[var(--radix-select-trigger-width)] max-h-[300px] bg-white border border-gray-200 shadow-lg rounded-md z-50"
                    sideOffset={4}
                  >
                    {Object.entries(agentsByCategory).map(([category, categoryAgents]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 text-right border-b">
                          {category}
                        </div>
                        {categoryAgents.map((agent) => (
                          <SelectItem 
                            key={agent.id} 
                            value={agent.id} 
                            className="text-right pr-8 pl-3 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex flex-col items-end w-full">
                              <span className="font-medium text-gray-900">{agent.name}</span>
                              <span className="text-sm text-gray-500">סוכן {agent.id}</span>
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
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-base lg:text-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={!selectedAgent || !password || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    מתחבר...
                  </div>
                ) : (
                  selectedAgentData ? `התחבר כ${selectedAgentData.name}` : "התחבר"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
