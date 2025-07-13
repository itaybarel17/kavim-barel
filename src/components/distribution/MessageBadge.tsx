import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MessageBadgeProps {
  subject: string;
  isBlinking: boolean;
  onClick: () => void;
}

export const MessageBadge: React.FC<MessageBadgeProps> = ({
  subject,
  isBlinking,
  onClick
}) => {
  // Define colors based on subject
  const getSubjectColors = (subject: string) => {
    switch (subject) {
      case 'לבטל הזמנה':
        return 'bg-red-600 text-black border-red-700 hover:bg-red-700 hover:text-white';
      case 'לדחות':
        return 'bg-red-600 text-white border-red-700 hover:bg-red-700';
      default:
        return 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600';
    }
  };

  const colorClasses = getSubjectColors(subject);

  return (
    <Badge
      className={cn(
        'cursor-pointer transition-all duration-200 px-2 py-1 text-xs font-bold border-2 shadow-md hover:shadow-lg active:scale-95',
        colorClasses,
        isBlinking && 'animate-pulse-slow shadow-lg'
      )}
      onClick={onClick}
    >
      {subject}
    </Badge>
  );
};