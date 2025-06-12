
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">ברוכים הבאים למערכת ההפצה</h1>
        <p className="text-xl text-muted-foreground mb-8">מערכת ניהול הזמנות והחזרות</p>
        
        <div className="space-y-4">
          <Link 
            to="/distribution" 
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            עבור לממשק ההפצה
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
