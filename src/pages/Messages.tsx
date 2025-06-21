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

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    subject: "",
    isHandled: "",
    dateFrom: "",
    dateTo: "",
    searchTerm: ""
  });
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const isAdmin = user?.agentnumber === "4";

  // Fetch messages with a simplified query first
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', filters],
    queryFn: async () => {
      console.log('Fetching messages with filters:', filters);
      
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

      if (filters.subject) {
        query = query.eq('subject', filters.subject as "לבטל הזמנה" | "לדחות" | "שינוי מוצרים" | "הנחות" | "אספקה" | "לקוח אחר" | "קו הפצה");
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
      
      console.log('Fetched messages:', data?.length || 0, 'messages');
      
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">מערכת הודעות</h1>
        <div className="text-sm text-gray-600">
          {user?.agentname} ({user?.agentnumber})
        </div>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">הודעות קיימות</TabsTrigger>
          <TabsTrigger value="new">הודעה חדשה</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>שליחת הודעה חדשה</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                הודעות המערכת
                <span className="text-sm font-normal text-gray-600">
                  {messages?.length || 0} הודעות
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                deletingMessageId={deletingMessageId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
