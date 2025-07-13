import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageForm } from "@/components/messages/MessageForm";
import { MessageList } from "@/components/messages/MessageList";
import { MessageFilters } from "@/components/messages/MessageFilters";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("new");
  const [filters, setFilters] = useState({
    subject: "",
    isHandled: "",
    dateFrom: "",
    dateTo: "",
    searchTerm: ""
  });
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const isAdmin = user?.agentnumber === "4";

  // Fetch messages with agent-based filtering
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['messages', filters, user?.agentnumber],
    queryFn: async () => {
      console.log('Fetching messages with filters:', filters, 'for agent:', user?.agentnumber);
      
      let query = supabase
        .from('messages')
        .select(`
          *,
          agents!messages_agentnumber_fkey(agentname),
          tag_agent:agents!messages_tagagent_fkey(agentname),
          mainorder(customername, ordernumber),
          mainreturns(customername, returnnumber)
        `)
        .order('created_at', { ascending: false });

      // Apply agent-based filtering
      if (!isAdmin) {
        if (user?.agentnumber === "99") {
          // Agent 99 sees only messages where they are tagged
          query = query.eq('tagagent', user.agentnumber);
        } else {
          // Regular agents see messages they created or are tagged in
          query = query.or(`agentnumber.eq.${user?.agentnumber},tagagent.eq.${user?.agentnumber}`);
        }
      }
      // Admin (agent 4) sees all messages - no additional filtering

      if (filters.subject) {
        query = query.eq('subject', filters.subject as "לבטל הזמנה" | "לדחות" | "שינוי מוצרים" | "הנחות" | "אספקה" | "הזמנה על לקוח אחר" | "מחסן");
      }
      
      if (filters.isHandled !== "") {
        query = query.eq('is_handled', filters.isHandled === "true");
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }

      if (filters.searchTerm) {
        query = query.or(`content.ilike.%${filters.searchTerm}%,correctcustomer.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      console.log('Fetched messages:', data?.length || 0, 'messages for agent', user?.agentnumber);
      
      return data || [];
    }
  });

  // Mark message as handled
  const markAsHandledMutation = useMutation({
    mutationFn: async ({ messageId, isHandled }: { messageId: number; isHandled: boolean }) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_handled: isHandled })
        .eq('messages_id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "הודעה עודכנה",
        description: "מצב הטיפול בהודעה עודכן בהצלחה",
      });
    },
    onError: (error) => {
      console.error('Error updating message:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את מצב ההודעה",
        variant: "destructive",
      });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('messages_id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "הודעה נמחקה",
        description: "ההודעה נמחקה בהצלחה",
      });
      setDeletingMessageId(null);
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההודעה",
        variant: "destructive",
      });
      setDeletingMessageId(null);
    }
  });

  const handleMarkAsHandled = (messageId: number, isHandled: boolean) => {
    markAsHandledMutation.mutate({ messageId, isHandled });
  };

  const handleDeleteMessage = (messageId: number) => {
    setDeletingMessageId(messageId);
    deleteMessageMutation.mutate(messageId);
  };

  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'} space-y-4`}>
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>מערכת הודעות</h1>
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          {user?.agentname} ({user?.agentnumber})
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-8' : ''}`}>
          <TabsTrigger value="messages" className={isMobile ? 'text-sm' : ''}>הודעות קיימות</TabsTrigger>
          <TabsTrigger value="new" className={isMobile ? 'text-sm' : ''}>הודעה חדשה</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>שליחת הודעה חדשה</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'p-3' : ''}>
              <MessageForm onMessageSent={() => setActiveTab("messages")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
                <span className={isMobile ? 'text-lg' : ''}>הודעות המערכת</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal text-gray-600`}>
                  {messages?.length || 0} הודעות
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'p-3' : ''}>
              <MessageFilters 
                filters={filters} 
                onFiltersChange={setFilters}
              />
              <MessageList 
                messages={messages || []} 
                isLoading={isLoading}
                currentUserNumber={user?.agentnumber || ""}
                isAdmin={isAdmin}
                onMarkAsHandled={handleMarkAsHandled}
                onDeleteMessage={handleDeleteMessage}
                onMessageUpdated={() => refetch()}
                deletingMessageId={deletingMessageId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
