
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
        
        {/* Compact premium navigation menu */}
        <div className="flex gap-1 p-1.5 border border-white/20 rounded-md bg-white/5 backdrop-blur-sm shadow-inner">
          <Link
            to="/calendar"
            className={`px-3 py-1.5 text-sm font-bold rounded border transition-all duration-200 ${
              location.pathname === '/calendar' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-lg scale-105 ring-2 ring-green-300/50' 
                : 'bg-gradient-to-r from-green-500/70 to-green-600/70 text-white border-green-400/70 hover:from-green-500 hover:to-green-600 hover:border-green-400 hover:shadow-sm'
            }`}
          >
            לוח שנה
          </Link>
          {isAdmin && (
            <>
              <Link
                to="/distribution"
                className={`px-3 py-1.5 text-sm font-bold rounded border transition-all duration-200 ${
                  location.pathname === '/distribution' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-lg scale-105 ring-2 ring-blue-300/50' 
                    : 'bg-gradient-to-r from-blue-500/70 to-blue-600/70 text-white border-blue-400/70 hover:from-blue-500 hover:to-blue-600 hover:border-blue-400 hover:shadow-sm'
                }`}
              >
                הפצה
              </Link>
              <Link
                to="/archive"
                className={`px-3 py-1.5 text-sm font-bold rounded border transition-all duration-200 ${
                  location.pathname === '/archive' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-lg scale-105 ring-2 ring-red-300/50' 
                    : 'bg-gradient-to-r from-red-500/70 to-red-600/70 text-white border-red-400/70 hover:from-red-600 hover:to-red-700 hover:border-red-400 hover:shadow-sm'
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
