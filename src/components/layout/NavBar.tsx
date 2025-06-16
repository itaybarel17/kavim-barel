
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
        <Link
          to="/calendar"
          className={`font-medium transition-colors hover:text-blue-100 ${location.pathname === '/calendar' ? 'text-white' : 'text-blue-200'}`}
        >
          לוח שנה
        </Link>
        {isAdmin && (
          <>
            <Link
              to="/distribution"
              className={`font-medium transition-colors hover:text-blue-100 ${location.pathname === '/distribution' ? 'text-white' : 'text-blue-200'}`}
            >הפצה</Link>
            <Link
              to="/archive"
              className={`font-medium transition-colors hover:text-blue-100 ${location.pathname === '/archive' ? 'text-white' : 'text-blue-200'}`}
            >ארכיון</Link>
          </>
        )}
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
