
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { WaitingCustomersCounter } from "./WaitingCustomersCounter";
import { Menu, X } from "lucide-react";

export const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.agentnumber === "4";

  const navItems = [
    { path: "/calendar", label: "לוח שנה", color: "green" },
    ...(isAdmin ? [
      { path: "/distribution", label: "הפצה", color: "orange" },
      { path: "/archive", label: "ארכיון", color: "red" }
    ] : [])
  ];

  const getNavItemClasses = (path: string, color: string) => {
    const isActive = location.pathname === path;
    return `px-3 py-2 text-sm font-bold rounded border transition-all duration-200 ${
      isActive 
        ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white border-${color}-400 shadow-lg scale-105 ring-2 ring-${color}-300/50`
        : `bg-gradient-to-r from-${color}-500/80 to-${color}-600/80 text-white/90 border-${color}-400/80 hover:from-${color}-500 hover:to-${color}-600 hover:border-${color}-400 hover:text-white hover:shadow-sm`
    }`;
  };

  return (
    <>
      {/* Mobile Header */}
      <nav className="lg:hidden flex justify-between items-center py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b shadow-lg px-0">
        <div className="flex items-center gap-3 px-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-white/10 p-2"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <Link to="/" className="text-lg font-bold text-white px-0">
            מערכת ההפצה
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <WaitingCustomersCounter />
          <span className="text-xs text-blue-100 max-w-[80px] truncate">{user.agentname}</span>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">תפריט ניווט</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {navItems.map(({ path, label, color }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-right ${getNavItemClasses(path, color)}`}
                >
                  {label}
                </Link>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">{user.agentname}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  התנתקות
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <nav className="hidden lg:flex justify-between items-center py-4 px-6 mb-8 bg-gradient-to-r from-blue-600 to-blue-700 border-b shadow-lg">
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-xl font-bold text-white hover:text-blue-100 transition-colors">
            מערכת ההפצה
          </Link>
          
          <div className="flex gap-1 p-1.5 border border-white/20 rounded-md bg-white/5 backdrop-blur-sm shadow-inner">
            {navItems.map(({ path, label, color }) => (
              <Link key={path} to={path} className={getNavItemClasses(path, color)}>
                {label}
              </Link>
            ))}
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
    </>
  );
};
