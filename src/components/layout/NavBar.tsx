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
    ...(isAdmin ? [
      { path: "/distribution", label: "הפצה", color: "orange" },
    ] : []),
    { path: "/calendar", label: "לוח שנה", color: "green" },
    { path: "/messages", label: "הודעות", color: "purple" },
    ...(isAdmin ? [
      { path: "/archive", label: "ארכיון", color: "red" },
      { path: "/lines", label: "קווים", color: "cyan" }
    ] : [])
  ];

  const getNavItemClasses = (path: string, color: string) => {
    const isActive = location.pathname === path;
    return `px-3 lg:px-4 py-2.5 text-xs lg:text-sm transition-all duration-300 rounded-xl ${
      isActive 
        ? `bg-gradient-to-br from-${color}-500/90 to-${color}-600/90 backdrop-blur-sm text-white font-bold border-2 border-white/30 shadow-lg scale-105 ring-2 ring-white/20 transform-gpu relative z-10`
        : `bg-gradient-to-br from-${color}-500/70 to-${color}-600/70 backdrop-blur-sm text-white/90 font-medium border border-white/20 hover:from-${color}-500/85 hover:to-${color}-600/85 hover:border-white/30 hover:text-white hover:shadow-md hover:scale-102 hover:ring-1 hover:ring-white/15`
    }`;
  };

  return (
    <>
      {/* Mobile Header */}
      <nav className="lg:hidden flex justify-between items-center py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b shadow-lg px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-white/10 p-2"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <Link to="/" className="text-lg font-bold text-white">
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
          <div className="bg-background w-64 h-full shadow-xl border-r" onClick={(e) => e.stopPropagation()}>
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
              {navItems.map(({ path, label, color }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-right px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white border-2 border-${color}-400 shadow-xl ring-4 ring-${color}-300/50 transform scale-105`
                        : `text-foreground hover:bg-muted hover:text-foreground border border-transparent hover:shadow-md hover:scale-102`
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{user.agentname}</span>
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
          
          <div className="flex gap-1.5 p-2 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner">
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
