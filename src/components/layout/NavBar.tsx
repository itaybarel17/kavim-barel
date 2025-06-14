
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.agentnumber === "4";

  return (
    <nav className="flex justify-between items-center py-4 px-6 mb-8 bg-background border-b">
      <div className="flex gap-4">
        <Link to="/" className="text-xl font-bold text-primary">מערכת ההפצה</Link>
        <Link
          to="/calendar"
          className={`font-medium ${location.pathname === '/calendar' ? 'text-primary' : 'text-gray-500'}`}
        >
          לוח שנה
        </Link>
        {isAdmin && (
          <>
            <Link
              to="/distribution"
              className={`font-medium ${location.pathname === '/distribution' ? 'text-primary' : 'text-gray-500'}`}
            >הפצה</Link>
            <Link
              to="/archive"
              className={`font-medium ${location.pathname === '/archive' ? 'text-primary' : 'text-gray-500'}`}
            >ארכיון</Link>
          </>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-700">{user.agentname}</span>
        <Button variant="outline" size="sm" onClick={logout}>התנתקות</Button>
      </div>
    </nav>
  );
};
