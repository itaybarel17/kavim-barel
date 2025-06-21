import React from 'react';
import { Warehouse } from 'lucide-react';
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
  return <div className="mb-4 space-y-2">
      {visibleMessages.map(message => <div key={message.messages_id} className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium
            ${!message.is_handled ? 'bg-orange-100 border-orange-300 text-orange-800 animate-pulse' : 'bg-gray-100 border-gray-300 text-gray-800'}
          `}>
          <Warehouse className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold text-2xl">מחסן:</span>
          <span className="flex-1 text-2xl">{message.content || 'הודעת מחסן'}</span>
        </div>)}
    </div>;
};