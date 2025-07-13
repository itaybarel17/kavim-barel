
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SUBJECT_OPTIONS = [
  { value: "לבטל הזמנה", label: "לבטל הזמנה" },
  { value: "לדחות", label: "לדחות" },
  { value: "שינוי מוצרים", label: "שינוי מוצרים" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "הזמנה על לקוח אחר", label: "הזמנה על לקוח אחר" },
  { value: "מחסן", label: "מחסן" }
] as const;

type MessageFormData = {
  subject?: "לבטל הזמנה" | "לדחות" | "שינוי מוצרים" | "הנחות" | "אספקה" | "הזמנה על לקוח אחר" | "מחסן";
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
  const [associationError, setAssociationError] = useState<string>("");

  const isAdmin = user?.agentnumber === "4";

  const form = useForm<MessageFormData>({
    defaultValues: {
      content: "",
      correctcustomer: ""
    }
  });

  const selectedSubject = form.watch("subject");

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
      // For warehouse messages, association is optional
      if (data.subject !== "מחסן") {
        // Validate that an association is required for non-warehouse messages
        if (!selectedItem) {
          throw new Error("חובה לשייך הזמנה, החזרה או קו הפצה להודעה");
        }
      }

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

      // Insert the message first
      const { error: messageError } = await supabase.from('messages').insert(messageData);
      if (messageError) throw messageError;

      // If message has order/return association, update message_alert for badge blink
      if (data.ordernumber) {
        const { error: orderError } = await supabase
          .from('mainorder')
          .update({ message_alert: true })
          .eq('ordernumber', data.ordernumber);
        if (orderError) console.warn('Failed to update order message_alert:', orderError);
      }

      if (data.returnnumber) {
        const { error: returnError } = await supabase
          .from('mainreturns')
          .update({ message_alert: true })
          .eq('returnnumber', data.returnnumber);
        if (returnError) console.warn('Failed to update return message_alert:', returnError);
      }
    },
    onSuccess: () => {
      form.reset();
      setSelectedItem(null);
      setAssociationError("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      
      toast({
        title: "הודעה נשלחה בהצלחה!",
        description: "ההודעה נשלחה למערכת והתווית עודכנה",
        duration: 3000,
      });

      // Navigate to existing messages tab after 1 second
      setTimeout(() => {
        const messagesTab = document.querySelector('[data-value="messages"]') as HTMLElement;
        if (messagesTab) {
          messagesTab.click();
        }
      }, 1000);
    },
    onError: (error) => {
      console.error('Error creating message:', error);
      if (error.message.includes("חובה לשייך")) {
        setAssociationError(error.message);
      } else {
        toast({
          title: "שגיאה",
          description: "לא ניתן לשלוח את ההודעה",
          variant: "destructive"
        });
      }
    }
  });

  const handleSearchSelect = (item: SelectedItem) => {
    setSelectedItem(item);
    setAssociationError("");
    
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
    // Clear previous association error
    setAssociationError("");
    
    // Validate association is present for non-warehouse messages
    if (data.subject !== "מחסן" && !selectedItem) {
      setAssociationError("חובה לשייך הזמנה, החזרה או קו הפצה להודעה");
      return;
    }
    
    // For distribution line messages, subject is optional
    if (selectedItem?.type === "schedules") {
      data.subject = undefined;
    }
    
    createMessageMutation.mutate(data);
  };

  // Check if subject should be required
  const isSubjectRequired = selectedItem?.type !== "schedules";
  
  // Check if association should be required (not for warehouse messages)
  const isAssociationRequired = selectedSubject !== "מחסן";

  // Filter subject options based on user permissions
  const availableSubjectOptions = SUBJECT_OPTIONS.filter(option => {
    if (option.value === "מחסן") {
      return isAdmin; // Only admin can see warehouse option
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Association requirement alert - only show if association is required */}
          {isAssociationRequired && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>חובה:</strong> יש לשייך הזמנה, החזרה או קו הפצה לכל הודעה. חל על כל הסוכנים.
              </AlertDescription>
            </Alert>
          )}

          {/* Warehouse message info for admin */}
          {selectedSubject === "מחסן" && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>הודעת מחסן:</strong> הודעה פנימית למשרד. לא נדרש שיוך להזמנה/החזרה/קו הפצה.
              </AlertDescription>
            </Alert>
          )}

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
                    {availableSubjectOptions.map((option) => (
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

          {/* 2. הודעה לגבי הזמנה/החזרה/קו הפצה - CONDITIONAL */}
          {isAssociationRequired && (
            <Card className={associationError ? "border-red-300 bg-red-50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  הודעה לגבי הזמנה/החזרה/קו הפצה
                  <span className="text-sm font-normal text-red-600">(חובה)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SearchComponent
                  onSelect={handleSearchSelect}
                  selectedItem={selectedItem}
                  onClear={handleSearchClear}
                />
                {associationError && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    {associationError}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
