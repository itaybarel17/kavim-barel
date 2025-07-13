import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerMessage {
  subject: string;
  customername: string;
  city: string;
}

interface CustomerMessageBannerProps {
  messages: CustomerMessage[];
}

export const CustomerMessageBanner: React.FC<CustomerMessageBannerProps> = ({ messages }) => {
  const isMobile = useIsMobile();
  
  if (messages.length === 0) return null;

  // Take only the first message to display
  const message = messages[0];

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-3'} bg-blue-50 border-2 border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-4`}>
      <MessageCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 animate-pulse`} />
      {!isMobile && <MessageCircle className="h-6 w-6 text-blue-600 animate-pulse" />}
      <MessageCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 animate-pulse`} />
      <span className={`text-blue-600 font-bold ${isMobile ? 'text-sm mx-2' : 'text-xl mx-4'}`}>
        {message.subject}: {message.customername}, {message.city}
      </span>
      <MessageCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 animate-pulse`} />
      {!isMobile && <MessageCircle className="h-6 w-6 text-blue-600 animate-pulse" />}
      <MessageCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 animate-pulse`} />
    </div>
  );
};