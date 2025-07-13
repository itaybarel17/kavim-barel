import React from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface MessageBadgeProps {
  subject: string;
  isBlinking: boolean;
  ordernumber?: number;
  returnnumber?: number;
  onStopBlinking?: () => void;
}

const getSubjectStyle = (subject: string) => {
  switch (subject) {
    case "לבטל הזמנה":
      return "bg-red-600 text-white border-black border-2";
    case "לדחות":
      return "bg-red-500 text-white";
    default:
      return "bg-orange-500 text-white";
  }
};

export const MessageBadge: React.FC<MessageBadgeProps> = ({
  subject,
  isBlinking,
  ordernumber,
  returnnumber,
  onStopBlinking
}) => {
  const handleClick = async () => {
    try {
      if (ordernumber) {
        await supabase
          .from('mainorder')
          .update({ message_alert: false })
          .eq('ordernumber', ordernumber);
      } else if (returnnumber) {
        await supabase
          .from('mainreturns')
          .update({ message_alert: false })
          .eq('returnnumber', returnnumber);
      }
      
      if (onStopBlinking) {
        onStopBlinking();
      }
    } catch (error) {
      console.error('Error updating message alert:', error);
    }
  };

  return (
    <Badge
      className={`
        text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-105
        ${getSubjectStyle(subject)}
        ${isBlinking ? 'animate-pulse' : ''}
      `}
      onClick={handleClick}
    >
      {subject}
    </Badge>
  );
};