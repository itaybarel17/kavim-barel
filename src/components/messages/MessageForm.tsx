
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchComponent } from "./SearchComponent";

const SUBJECT_OPTIONS = [
  { value: "לבטל", label: "לבטל" },
  { value: "לדחות", label: "לדחות" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "לקוח אחר", label: "לקוח אחר" }
] as const;

type MessageFormData = {
  subject?: "לבטל" | "לדחות" | "הנחות" | "אספקה" | "לקוח אחר";
  content: string;
  tagagent?: string;
  correctcustomer?: string;
  ordernumber?: number;
  returnnumber?: number;
  schedule_id?: number;
};

type SelectedItem = {
  type: "orders" | "returns" | "schedules";
  id: number;
  title: string;
  subtitle: string;
};

export const MessageForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const form = useForm<MessageFormData>({
    defaultValues: {
      content: "",
      correctcustomer: ""
    }
  });

  // Fetch agents for tagging
  const { data: agents } = useQuery({
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

  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const messageData: any = {
        subject: data.subject || null,
        content: data.content,
        agentnumber: user?.agentnumber,
        tagagent: data.tagagent === "none" ? null : data.tagagent || null,
        correctcustomer: data.correctcustomer || null,
        ordernumber: data.ordernumber || null,
        returnnumber: data.returnnumber || null,
        schedule_id: data.schedule_id || null
      };

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;
    },
    onSuccess: () => {
      form.reset();
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה בהצלחה למערכת"
      });
    },
    onError: (error) => {
      console.error('Error creating message:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההודעה",
        variant: "destructive"
      });
    }
  });

  const handleSearchSelect = (item: SelectedItem) => {
    setSelectedItem(item);
    
    // Clear previous selections
    form.setValue("ordernumber", undefined);
    form.setValue("returnnumber", undefined);
    form.setValue("schedule_id", undefined);
    
    // Set the appropriate field based on item type
    if (item.type === "orders") {
      form.setValue("ordernumber", item.id);
    } else if (item.type === "returns") {
      form.setValue("returnnumber", item.id);
    } else if (item.type === "schedules") {
      form.setValue("schedule_id", item.id);
    }
  };

  const handleSearchClear = () => {
    setSelectedItem(null);
    form.setValue("ordernumber", undefined);
    form.setValue("returnnumber", undefined);
    form.setValue("schedule_id", undefined);
  };

  const onSubmit = (data: MessageFormData) => {
    // For distribution line messages, subject is optional
    if (selectedItem?.type === "schedules") {
      data.subject = undefined;
    }
    
    createMessageMutation.mutate(data);
  };

  // Check if subject should be required
  const isSubjectRequired = selectedItem?.type !== "schedules";

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 1. נושא ההודעה */}
          <FormField
            control={form.control}
            name="subject"
            rules={isSubjectRequired ? { required: "נושא ההודעה נדרש" } : {}}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  נושא ההודעה
                  {!isSubjectRequired && <span className="text-gray-500"> (אופציונלי עבור קווי הפצה)</span>}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!isSubjectRequired}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isSubjectRequired ? "בחר נושא" : "לא נדרש עבור קווי הפצה"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. הודעה לגבי הזמנה/החזרה/קו הפצה */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הודעה לגבי הזמנה/החזרה/קו הפצה</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchComponent
                onSelect={handleSearchSelect}
                selectedItem={selectedItem}
                onClear={handleSearchClear}
              />
            </CardContent>
          </Card>

          {/* 3. לקוח נכון (אם שודר על לקוח אחר) */}
          <FormField
            control={form.control}
            name="correctcustomer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>לקוח נכון (אם שודר על לקוח אחר)</FormLabel>
                <FormControl>
                  <Input placeholder="שם הלקוח הנכון..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. תייג סוכן */}
          <FormField
            control={form.control}
            name="tagagent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תייג סוכן (אופציונלי)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוכן לתיוג" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">ללא תיוג</SelectItem>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.agentnumber} value={agent.agentnumber}>
                        {agent.agentname} ({agent.agentnumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 5. תוכן ההודעה */}
          <FormField
            control={form.control}
            name="content"
            rules={{ required: "תוכן ההודעה נדרש" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>תוכן ההודעה</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="כתוב כאן את תוכן ההודעה..." 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 6. שלח הודעה */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createMessageMutation.isPending}
          >
            {createMessageMutation.isPending ? "שולח..." : "שלח הודעה"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
