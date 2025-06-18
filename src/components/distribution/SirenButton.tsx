
import React from 'react';
import { Siren } from 'lucide-react';

interface SirenButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

export const SirenButton: React.FC<SirenButtonProps> = ({ isActive, onToggle }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`p-1 rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-300' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isActive ? 'כבה התראה' : 'הפעל התראה'}
    >
      <Siren className="h-4 w-4" />
    </button>
  );
};
