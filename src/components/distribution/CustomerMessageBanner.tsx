import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  
  if (messages.length === 0) return null;

  const handleMessageClick = (message: CustomerMessage) => {
    setSelectedMessage(message);
  };

  return (
    <TooltipProvider>
      <div className={`bg-blue-50 border-2 border-blue-200 rounded-lg ${isMobile ? 'p-2' : 'p-3'} shadow-sm`}>
        {messages.map((message, index) => (
          <div key={index} className={`${index > 0 ? 'mt-3 pt-2 border-t border-blue-200' : ''}`}>
            <div className={`flex items-center justify-between gap-2`}>
              <div className={`text-blue-700 font-medium ${isMobile ? 'text-sm' : 'text-base'} flex-1`}>
                {message.subject}: {message.customername}, {message.city}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MessageCircle 
                    className="h-4 w-4 cursor-pointer transition-all duration-200 hover:scale-110 text-blue-600 hover:text-blue-700 flex-shrink-0"
                    onClick={() => handleMessageClick(message)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>לחץ לפרטים נוספים</p>
                </TooltipContent>
              </Tooltip>
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

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>פרטי הודעה</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-3">
              <div>
                <span className="font-medium text-blue-700">נושא: </span>
                <span>{selectedMessage.subject}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">לקוח: </span>
                <span>{selectedMessage.customername}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">עיר: </span>
                <span>{selectedMessage.city}</span>
              </div>
              {selectedMessage.relatedItems && selectedMessage.relatedItems.length > 0 && (
                <div>
                  <span className="font-medium text-blue-700">פריטים קשורים: </span>
                  <div className="mt-1">
                    {selectedMessage.relatedItems.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        {item.type === 'order' ? 'הזמנה' : 'החזרה'} #{item.id} ({item.customername})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};