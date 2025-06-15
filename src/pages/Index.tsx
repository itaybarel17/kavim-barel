
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect when auth state is fully loaded and user exists
    if (!isLoading && user) {
      // Admin (Agent 4) goes to distribution
      if (user.agentnumber === "4") {
        navigate("/distribution", { replace: true });
      } else {
        // All other agents go to calendar
        navigate("/calendar", { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth or redirecting
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">מעביר לדף המתאים...</p>
        </div>
      </div>
    );
  }

  // This should not be reached due to ProtectedRoute, but just in case
  return null;
};

export default Index;
