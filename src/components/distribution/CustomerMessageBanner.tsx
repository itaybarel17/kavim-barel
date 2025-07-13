import React from 'react';
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

  return (
    <div className={`bg-blue-50 border-2 border-blue-200 rounded-lg ${isMobile ? 'p-2' : 'p-3'} shadow-sm`}>
      {messages.map((message, index) => (
        <div key={index} className={`text-blue-700 font-medium ${isMobile ? 'text-sm' : 'text-base'} ${index > 0 ? 'mt-1' : ''}`}>
          {message.subject}: {message.customername}, {message.city}
        </div>
      ))}
    </div>
  );
};