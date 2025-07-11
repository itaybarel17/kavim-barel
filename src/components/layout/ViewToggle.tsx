import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';

export const ViewToggle: React.FC = () => {
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem('force-desktop-view');
    if (savedPreference === 'true') {
      setForceDesktop(true);
      document.body.classList.add('force-desktop-view');
    }
  }, []);

  const toggleDesktopView = () => {
    const newValue = !forceDesktop;
    setForceDesktop(newValue);
    localStorage.setItem('force-desktop-view', newValue.toString());
    
    if (newValue) {
      document.body.classList.add('force-desktop-view');
    } else {
      document.body.classList.remove('force-desktop-view');
    }
  };

  const toggleMobileView = () => {
    setForceDesktop(false);
    localStorage.setItem('force-desktop-view', 'false');
    document.body.classList.remove('force-desktop-view');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2 md:hidden">
      {!forceDesktop ? (
        <Button
          onClick={toggleDesktopView}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Monitor size={16} className="mr-1" />
          תצוגת ווב
        </Button>
      ) : (
        <Button
          onClick={toggleMobileView}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Smartphone size={16} className="mr-1" />
          תצוגת מובייל
        </Button>
      )}
    </div>
  );
};