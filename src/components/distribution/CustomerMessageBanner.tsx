import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerMessage {
  subject: string;
  customername: string;
  city: string;
  relatedItems?: Array<{
    type: 'order' | 'return';
    id: number;
    customername: string;
  }>;
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
        <div key={index} className={`${index > 0 ? 'mt-3 pt-2 border-t border-blue-200' : ''}`}>
          <div className={`text-blue-700 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
            {message.subject}: {message.customername}, {message.city}
          </div>
          {message.relatedItems && message.relatedItems.length > 0 && (
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 mt-1`}>
              + פריטים קשורים נוספים: {message.relatedItems.map(item => 
                `${item.type === 'order' ? 'הזמנה' : 'החזרה'} #${item.id} (${item.customername})`
              ).join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};