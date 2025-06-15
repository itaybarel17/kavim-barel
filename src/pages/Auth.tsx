
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const agents = [
  { id: "1", name: "יניב", title: "סוכן מכירות" },
  { id: "4", name: "משרד", title: "מנהל מערכת" },
  { id: "99", name: "קנדי", title: "סוכן מיוחד" },
  // Add more agents as needed
];

export default function Auth() {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      setError("נא לבחור סוכן");
      return;
    }

    // For now, allow login without password validation
    // TODO: Add password validation when ready
    
    login(selectedAgent);
    setError("");
    
    // Navigation will be handled by the useEffect above
  };

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

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
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-gray-500">{agent.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAgent && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    סיסמה (אופציונלי לעת עתה)
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="הכנס סיסמה..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-right"
                    dir="rtl"
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
                disabled={!selectedAgent}
              >
                {selectedAgentData ? `התחבר כ${selectedAgentData.name}` : "התחבר"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
