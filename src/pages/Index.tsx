
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Admin (Agent 4) goes to distribution
      if (user.agentnumber === "4") {
        navigate("/distribution");
      } else {
        // All other agents go to calendar
        navigate("/calendar");
      }
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">מעביר לדף המתאים...</p>
      </div>
    </div>
  );
};

export default Index;
