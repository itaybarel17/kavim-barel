import React, { useState } from 'react';
import { Warehouse, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface WarehouseMessage {
  messages_id: number;
  content: string | null;
  is_handled: boolean | null;
  created_at: string;
}
interface WarehouseMessageBannerProps {
  messages: WarehouseMessage[];
}
export const WarehouseMessageBanner: React.FC<WarehouseMessageBannerProps> = ({
  messages
}) => {
  const isMobile = useIsMobile();
  const [selectedMessage, setSelectedMessage] = useState<WarehouseMessage | null>(null);
  
  if (!messages || messages.length === 0) {
    return null;
  }

  // Filter messages - hide handled messages after midnight of the same day
  const visibleMessages = messages.filter(message => {
    if (!message.is_handled) {
      return true; // Show all unhandled messages
    }

    // For handled messages, check if it's still the same day
    const messageDate = new Date(message.created_at);
    const now = new Date();
    const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // If the message was created today and it's still the same day, show it
    return messageDate >= midnightToday;
  });
  
  if (visibleMessages.length === 0) {
    return null;
  }

  const handleMessageClick = (message: WarehouseMessage) => {
    setSelectedMessage(message);
  };

  return (
    <TooltipProvider>
      <div className={`mb-4 space-y-2`}>
        {visibleMessages.map(message => (
          <div key={message.messages_id} className={`
            flex items-center gap-2 ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} rounded-lg border-2 ${isMobile ? 'text-xs' : 'text-sm'} font-medium
            ${!message.is_handled ? 'bg-orange-100 border-orange-300 text-orange-800 animate-pulse' : 'bg-gray-100 border-gray-300 text-gray-800'}
          `}>
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageCircle 
                  className="h-4 w-4 cursor-pointer transition-all duration-200 hover:scale-110 text-orange-600 hover:text-orange-700 flex-shrink-0"
                  onClick={() => handleMessageClick(message)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>לחץ לפרטים נוספים</p>
              </TooltipContent>
            </Tooltip>
            <span className={`flex-1 ${isMobile ? 'text-base' : 'text-2xl'} text-right`}>{message.content || 'הודעת מחסן'}</span>
            <span className={`font-semibold ${isMobile ? 'text-base' : 'text-2xl'} text-right`}>:מחסן  </span>
            <Warehouse className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>הודעת מחסן</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-3">
              <div>
                <span className="font-medium text-orange-700">תוכן ההודעה: </span>
                <span>{selectedMessage.content || 'הודעת מחסן'}</span>
              </div>
              <div>
                <span className="font-medium text-orange-700">תאריך יצירה: </span>
                <span>{new Date(selectedMessage.created_at).toLocaleString('he-IL')}</span>
              </div>
              <div>
                <span className="font-medium text-orange-700">סטטוס: </span>
                <span>{selectedMessage.is_handled ? 'טופלה' : 'לא טופלה'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};