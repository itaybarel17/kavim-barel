
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, X, User, Tag, FileText, RotateCcw } from "lucide-react";

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
  schedule_id: number | null;
  agents?: { agentname: string };
  tag_agent?: { agentname: string };
  mainorder?: { customername: string; ordernumber: number };
  mainreturns?: { customername: string; returnnumber: number };
};

type MessageCardProps = {
  message: Message;
  isAdmin: boolean;
  onMarkAsHandled: (messageId: number, isHandled: boolean) => void;
};

const getSubjectColor = (subject: string | null) => {
  switch (subject) {
    case "לבטל": return "bg-red-100 text-red-800";
    case "לדחות": return "bg-yellow-100 text-yellow-800";
    case "הנחות": return "bg-green-100 text-green-800";
    case "אספקה": return "bg-blue-100 text-blue-800";
    case "לקוח אחר": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isAdmin,
  onMarkAsHandled
}) => {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: he
  });

  return (
    <Card className={`${message.is_handled ? 'bg-gray-50 border-gray-200' : 'bg-white border-l-4 border-l-blue-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {message.subject && (
              <Badge className={getSubjectColor(message.subject)}>
                {message.subject}
              </Badge>
            )}
            {message.is_handled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                טופל
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-500 text-left">
            {timeAgo}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>
            {message.agents?.agentname || `סוכן ${message.agentnumber}`}
          </span>
          
          {message.tag_agent && (
            <>
              <Tag className="w-4 h-4 mr-1" />
              <span className="font-medium">
                מתויג: {message.tag_agent.agentname}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {message.content && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {message.correctcustomer && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-600">לקוח נכון:</span>
            <span className="text-gray-900">{message.correctcustomer}</span>
          </div>
        )}

        {(message.mainorder || message.mainreturns) && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
            <FileText className="w-4 h-4 text-blue-600" />
            {message.mainorder && (
              <span>
                <span className="font-medium">הזמנה #{message.mainorder.ordernumber}</span>
                <span className="text-gray-600"> - {message.mainorder.customername}</span>
              </span>
            )}
            {message.mainreturns && (
              <span>
                <span className="font-medium">החזרה #{message.mainreturns.returnnumber}</span>
                <span className="text-gray-600"> - {message.mainreturns.customername}</span>
              </span>
            )}
          </div>
        )}

        {message.schedule_id && (
          <div className="flex items-center gap-2 text-sm bg-orange-50 p-2 rounded">
            <Tag className="w-4 h-4 text-orange-600" />
            <span className="font-medium">מזהה לוח זמנים: {message.schedule_id}</span>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 pt-2 border-t">
            {!message.is_handled ? (
              <Button
                size="sm"
                onClick={() => onMarkAsHandled(message.messages_id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                סמן כטופל
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAsHandled(message.messages_id, false)}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                סמן כלא טופל
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
