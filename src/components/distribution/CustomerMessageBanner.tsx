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
    <div className="space-y-1">
      {messages.map((message, index) => (
        <div key={index} className={`text-blue-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {message.subject}: {message.customername}, {message.city}
        </div>
      ))}
    </div>
  );
};