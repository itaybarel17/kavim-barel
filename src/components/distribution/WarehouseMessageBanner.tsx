
import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WarehouseMessage {
  messages_id: number;
  content: string;
  created_at: string;
  is_handled: boolean;
  agents: {
    agentname: string;
  };
}

export const WarehouseMessageBanner: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show for admin (agent 4)
  const isAdmin = user?.agentnumber === "4";

  // Fetch unhandled warehouse messages
  const { data: warehouseMessages } = useQuery({
    queryKey: ['warehouse-messages'],
    queryFn: async (): Promise<WarehouseMessage[]> => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          messages_id,
          content,
          created_at,
          is_handled,
          agents!messages_agentnumber_fkey(agentname)
        `)
        .eq('subject', 'מחסן')
        .eq('is_handled', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching warehouse messages:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Mark message as handled mutation
  const markAsHandledMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_handled: true })
        .eq('messages_id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-messages'] });
      toast({
        title: "הודעה טופלה",
        description: "הודעת המחסן סומנה כמטופלת",
      });
    },
    onError: (error) => {
      console.error('Error marking message as handled:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטפל בהודעה",
        variant: "destructive",
      });
    }
  });

  // Don't render if not admin or no messages
  if (!isAdmin || !warehouseMessages?.length) {
    return null;
  }

  const handleMarkAsHandled = (messageId: number) => {
    markAsHandledMutation.mutate(messageId);
  };

  return (
    <div className="space-y-3">
      {warehouseMessages.map((message) => (
        <div
          key={message.messages_id}
          className="flex items-center justify-between gap-4 bg-orange-50 border-2 border-orange-200 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-orange-600" />
            <div>
              <span className="text-orange-600 font-bold text-3xl">
                הודעה למחסן
              </span>
              <div className="text-orange-800 mt-1">
                <strong>מאת:</strong> {message.agents?.agentname}
              </div>
              <div className="text-orange-700 text-sm mt-1">
                {message.content}
              </div>
              <div className="text-orange-600 text-xs mt-1">
                {new Date(message.created_at).toLocaleString('he-IL')}
              </div>
            </div>
          </div>
          <Button
            onClick={() => handleMarkAsHandled(message.messages_id)}
            disabled={markAsHandledMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {markAsHandledMutation.isPending ? "מטפל..." : "טופל"}
          </Button>
        </div>
      ))}
    </div>
  );
};
