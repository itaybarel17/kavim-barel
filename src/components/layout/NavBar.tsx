
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { WaitingCustomersCounter } from "./WaitingCustomersCounter";

export const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.agentnumber === "4";

  return (
    <nav className="flex justify-between items-center py-4 px-6 mb-8 bg-gradient-to-r from-blue-600 to-blue-700 border-b shadow-lg">
      <div className="flex gap-4 items-center">
        <Link to="/" className="text-xl font-bold text-white hover:text-blue-100 transition-colors">מערכת ההפצה</Link>
        
        {/* Navigation menu with frame */}
        <div className="flex gap-2 p-2 border-2 border-white/30 rounded-lg bg-white/10 backdrop-blur-sm">
          <Link
            to="/calendar"
            className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              location.pathname === '/calendar' 
                ? 'bg-green-500 text-white border-green-400 shadow-lg' 
                : 'bg-green-500/80 text-white border-green-400/80 hover:bg-green-500 hover:border-green-400'
            }`}
          >
            לוח שנה
          </Link>
          {isAdmin && (
            <>
              <Link
                to="/distribution"
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  location.pathname === '/distribution' 
                    ? 'bg-blue-500 text-white border-blue-400 shadow-lg' 
                    : 'bg-blue-500/80 text-white border-blue-400/80 hover:bg-blue-500 hover:border-blue-400'
                }`}
              >
                הפצה
              </Link>
              <Link
                to="/archive"
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  location.pathname === '/archive' 
                    ? 'bg-red-500 text-white border-red-400 shadow-lg' 
                    : 'bg-red-500/80 text-white border-red-400/80 hover:bg-red-500 hover:border-red-400'
                }`}
              >
                ארכיון
              </Link>
            </>
          )}
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        <WaitingCustomersCounter />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-blue-100">{user.agentname}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
          >
            התנתקות
          </Button>
        </div>
      </div>
    </nav>
  );
};
