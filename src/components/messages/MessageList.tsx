
import React from "react";
import { MessageCard } from "./MessageCard";
import { Skeleton } from "@/components/ui/skeleton";

type Message = {
  messages_id: number;
  subject: string | null;
  content: string | null;
  created_at: string;
  is_handled: boolean | null;
  agentnumber: string | null;
  tagagent: string | null;
  correctcustomer: string | null;
  ordernumber: number | null;
  returnnumber: number | null;
  agents?: { agentname: string };
  tag_agent?: { agentname: string };
  mainorder?: { customername: string; ordernumber: number };
  mainreturns?: { customername: string; returnnumber: number };
};

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  isAdmin: boolean;
  onMarkAsHandled: (messageId: number, isHandled: boolean) => void;
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  isAdmin,
  onMarkAsHandled
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>לא נמצאו הודעות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {messages.map((message) => (
        <MessageCard
          key={message.messages_id}
          message={message}
          isAdmin={isAdmin}
          onMarkAsHandled={onMarkAsHandled}
        />
      ))}
    </div>
  );
};
