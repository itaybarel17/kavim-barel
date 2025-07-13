import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface EditMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    messages_id: number;
    subject: string;
    content: string | null;
    tagagent: string | null;
  };
  onMessageUpdated: () => void;
}

export const EditMessageDialog: React.FC<EditMessageDialogProps> = ({
  isOpen,
  onClose,
  message,
  onMessageUpdated
}) => {
  const [content, setContent] = useState(message.content || '');
  const [tagagent, setTagagent] = useState(message.tagagent || 'none');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch agents for dropdown
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .order('agentname');
      
      if (error) throw error;
      return data;
    }
  });

  // Reset form when message changes
  useEffect(() => {
    setContent(message.content || '');
    setTagagent(message.tagagent || 'none');
  }, [message]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: content.trim() || null,
          tagagent: tagagent === 'none' ? null : tagagent
        })
        .eq('messages_id', message.messages_id);

      if (error) throw error;

      toast({
        title: "הודעה עודכנה",
        description: "תוכן ההודעה והתיוג עודכנו בהצלחה"
      });

      onMessageUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון ההודעה",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת הודעה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">נושא (לא ניתן לערוך):</Label>
            <div className="text-sm p-2 bg-gray-50 rounded border">
              {message.subject}
            </div>
          </div>

          <div>
            <Label htmlFor="content">תוכן ההודעה:</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="הזן תוכן ההודעה..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tagagent">תיוג סוכן:</Label>
            <Select value={tagagent} onValueChange={setTagagent}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר סוכן לתיוג..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא תיוג</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.agentnumber} value={agent.agentnumber}>
                    {agent.agentname} ({agent.agentnumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};