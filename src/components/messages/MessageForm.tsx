
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
  { value: "לקוח אחר", label: "לקוח אחר" },
  { value: "קו הפצה", label: "קו הפצה" },
  { value: "מחסן", label: "מחסן" }
] as const;

type MessageFormData = {
  subject?: "לבטל הזמנה" | "לדחות" | "שינוי מוצרים" | "הנחות" | "אספקה" | "לקוח אחר" | "קו הפצה" | "מחסן";
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

interface MessageFormProps {
  onMessageSent?: () => void;
}

export const MessageForm: React.FC<MessageFormProps> = ({ onMessageSent }) => {
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

  // Clear irrelevant fields when subject changes
  React.useEffect(() => {
    if (selectedSubject) {
      // Clear "correct customer" if not "order for another customer"
      if (selectedSubject !== "לקוח אחר") {
        form.setValue("correctcustomer", "");
      }
      
      // Clear associations that don't match the subject
      if (selectedSubject === "אספקה" || selectedSubject === "מחסן" || selectedSubject === "קו הפצה") {
        // For supply/warehouse - can only associate with schedules
        if (selectedItem && selectedItem.type !== "schedules") {
          setSelectedItem(null);
          form.setValue("ordernumber", undefined);
          form.setValue("returnnumber", undefined);
          form.setValue("schedule_id", undefined);
        }
      } else {
        // For other subjects - cannot associate with schedules
        if (selectedItem && selectedItem.type === "schedules") {
          setSelectedItem(null);
          form.setValue("ordernumber", undefined);
          form.setValue("returnnumber", undefined);
          form.setValue("schedule_id", undefined);
        }
      }
    }
  }, [selectedSubject, selectedItem, form]);

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
      // Validate association based on subject
      if (data.subject === "אספקה" || data.subject === "מחסן" || data.subject === "קו הפצה") {
        // Supply/warehouse/distribution can only be associated with schedules (and it's optional for warehouse)
        if (selectedItem && selectedItem.type !== "schedules") {
          throw new Error("הודעות אספקה, מחסן וקו הפצה יכולות להיות משוייכות רק לקווי הפצה");
        }
        if ((data.subject === "אספקה" || data.subject === "קו הפצה") && !selectedItem) {
          throw new Error("חובה לשייך קו הפצה להודעת אספקה וקו הפצה");
        }
      } else if (data.subject) {
        // Other subjects must be associated with orders/returns only
        if (!selectedItem) {
          throw new Error("חובה לשייך הזמנה או החזרה להודעה");
        }
        if (selectedItem.type === "schedules") {
          throw new Error("לא ניתן לשייך קו הפצה להודעה זו");
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
      queryClient.invalidateQueries({ queryKey: ['customer-messages'] });
      
      toast({
        title: "הודעה נשלחה בהצלחה!",
        description: "ההודעה נשלחה למערכת והתווית עודכנה",
        duration: 3000,
      });

      // Call the navigation callback
      if (onMessageSent) {
        onMessageSent();
      }
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
    
    createMessageMutation.mutate(data);
  };

  // Check if "correct customer" field should be shown
  const shouldShowCorrectCustomer = selectedSubject === "לקוח אחר";
  
  // Check if association should be required and what type
  const shouldShowScheduleAssociation = selectedSubject === "אספקה" || selectedSubject === "מחסן" || selectedSubject === "קו הפצה";
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
          
          {/* 1. נושא ההודעה - ראשון ובולט */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                נושא ההודעה
                <span className="text-sm font-normal text-blue-700">(חובה - קובע את שלבי המילוי הבאים)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="subject"
                rules={{ required: "נושא ההודעה נדרש" }}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-lg h-12 border-2">
                          <SelectValue placeholder="בחר נושא ההודעה..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSubjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-lg py-3">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. שיוך להזמנה/החזרה/קו הפצה - מותנה בנושא */}
          {selectedSubject && (
            <div className="animate-fade-in">
              <Card className={associationError ? "border-red-300 bg-red-50" : "border-2 border-green-200 bg-green-50"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    {shouldShowScheduleAssociation ? "שיוך לקו הפצה" : "שיוך להזמנה או החזרה"}
                    {isAssociationRequired && <span className="text-sm font-normal text-red-600">(חובה)</span>}
                    {!isAssociationRequired && <span className="text-sm font-normal text-green-700">(אופציונלי)</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchComponent
                    onSelect={handleSearchSelect}
                    selectedItem={selectedItem}
                    onClear={handleSearchClear}
                    allowedTypes={shouldShowScheduleAssociation ? ["schedules"] : ["orders", "returns"]}
                  />
                  {associationError && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      {associationError}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. לקוח נכון - רק עבור "הזמנה על לקוח אחר" */}
          {shouldShowCorrectCustomer && (
            <div className="animate-fade-in">
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                    <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    לקוח נכון
                    <span className="text-sm font-normal text-amber-700">(נדרש עבור הזמנה על לקוח אחר)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="correctcustomer"
                    rules={{ required: "יש למלא את שם הלקוח הנכון" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="שם הלקוח הנכון..." 
                            className="text-lg h-12 border-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* 4. תייג סוכן */}
          {selectedSubject && (
            <div className="animate-fade-in">
              <FormField
                control={form.control}
                name="tagagent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">תייג סוכן (אופציונלי)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
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
            </div>
          )}

          {/* 5. תוכן ההודעה */}
          {selectedSubject && (
            <div className="animate-fade-in">
              <FormField
                control={form.control}
                name="content"
                rules={{ required: "תוכן ההודעה נדרש" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">תוכן ההודעה</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="כתוב כאן את תוכן ההודעה..." 
                        className="min-h-[120px] text-lg border-2" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* 6. שלח הודעה */}
          {selectedSubject && (
            <div className="animate-fade-in">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold" 
                disabled={createMessageMutation.isPending}
              >
                {createMessageMutation.isPending ? "שולח הודעה..." : "שלח הודעה"}
              </Button>
            </div>
          )}

          {/* הודעות הדרכה */}
          {selectedSubject === "מחסן" && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>הודעת מחסן:</strong> הודעה פנימית למשרד. שיוך לקו הפצה הוא אופציונלי.
              </AlertDescription>
            </Alert>
          )}

          {selectedSubject === "אספקה" && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>הודעת אספקה:</strong> חובה לשייך לקו הפצה.
              </AlertDescription>
            </Alert>
          )}

          {shouldShowCorrectCustomer && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>לקוח אחר:</strong> חובה למלא את שם הלקוח הנכון.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  );
};
