import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, TruckIcon, CalendarIcon, Calendar, Archive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WaitingCustomersCounter } from './WaitingCustomersCounter';

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">מערכת הזמנות</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className={`text-sm border-white/30 transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-white text-blue-600 hover:bg-gray-100' 
                  : 'text-white bg-transparent hover:bg-white/20 opacity-80'
              }`}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              לוח השליטה
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/distribution')}
              className={`text-sm border-white/30 transition-all duration-200 ${
                isActive('/distribution') 
                  ? 'bg-white text-blue-600 hover:bg-gray-100' 
                  : 'text-white bg-transparent hover:bg-white/20 opacity-80'
              }`}
            >
              <TruckIcon className="h-4 w-4 mr-2" />
              חלוקה
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/calendar')}
              className={`text-sm border-white/30 transition-all duration-200 ${
                isActive('/calendar') 
                  ? 'bg-white text-blue-600 hover:bg-gray-100' 
                  : 'text-white bg-transparent hover:bg-white/20 opacity-80'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              לוח שנה
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/archive')}
              className={`text-sm border-white/30 transition-all duration-200 ${
                isActive('/archive') 
                  ? 'bg-white text-blue-600 hover:bg-gray-100' 
                  : 'text-white bg-transparent hover:bg-white/20 opacity-80'
              }`}
            >
              <Archive className="h-4 w-4 mr-2" />
              ארכיון
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WaitingCustomersCounter currentUser={user} />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {user?.agentname} (#{user?.agentnumber})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className={`text-sm border-white/30 text-white bg-transparent hover:bg-white/20 opacity-80`}
            >
              <LogOut className="h-4 w-4 mr-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
