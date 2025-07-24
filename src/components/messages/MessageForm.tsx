
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
import { SearchComponent, RelatedItem } from "./SearchComponent";
import { SubjectSelector } from "./SubjectSelector";
import { CustomerSelector } from "./CustomerSelector";
import { RelatedItemsDialog } from "./RelatedItemsDialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const SUBJECT_OPTIONS = [
  { value: "לבטל הזמנה", label: "לבטל הזמנה" },
  { value: "לדחות", label: "לדחות" },
  { value: "שינוי מוצרים", label: "שינוי מוצרים" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "הזמנה על לקוח אחר", label: "הזמנה על לקוח אחר" },
  { value: "מחסן", label: "מחסן" },
  { value: "להחזיר הזמנה עם גלידה", label: "להחזיר הזמנה עם גלידה" }
] as const;

type MessageFormData = {
  subject?: "לבטל הזמנה" | "לדחות" | "שינוי מוצרים" | "הנחות" | "אספקה" | "הזמנה על לקוח אחר" | "מחסן" | "להחזיר הזמנה עם גלידה";
  content: string;
  tagagent?: string;
  correctcustomer?: string;
  city?: string;
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
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelatedItem[]>([]);
  const [relatedItemsDialogOpen, setRelatedItemsDialogOpen] = useState(false);
  const [pendingRelatedItems, setPendingRelatedItems] = useState<RelatedItem[]>([]);
  const [associationError, setAssociationError] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSystemCustomer, setIsSystemCustomer] = useState(true);

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
      // Clear "correct customer" and "city" if not "order for another customer"
      if (selectedSubject !== "הזמנה על לקוח אחר") {
        form.setValue("correctcustomer", "");
        form.setValue("city", "");
      }
      
      // For supply/warehouse - can associate with both orders/returns AND schedules
      // Only clear if user is switching to incompatible types
      if (selectedSubject !== "אספקה" && selectedSubject !== "מחסן") {
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

  // Fetch cities for the city selector
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('city')
        .order('city');
      if (error) throw error;
      return data;
    }
  });

  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      // Define subjects that require mandatory association
      const mandatoryAssociationSubjects = ["לבטל הזמנה", "לדחות", "שינוי מוצרים", "הנחות", "הזמנה על לקוח אחר", "אספקה", "להחזיר הזמנה עם גלידה"];
      
      // Validate association based on subject
      if (data.subject === "אספקה" || data.subject === "מחסן") {
        // Supply/warehouse can be associated with both orders/returns OR schedules
        if (mandatoryAssociationSubjects.includes(data.subject!) && !selectedItem) {
          throw new Error("חובה לשייך הזמנה, החזרה או קו הפצה להודעת " + data.subject);
        }
        // Warehouse messages don't require association
      } else if (data.subject === "להחזיר הזמנה עם גלידה") {
        // Ice cream return subject requires order/return association only
        if (!selectedItem) {
          throw new Error("חובה לשייך הזמנה או החזרה להודעת " + data.subject);
        }
        if (selectedItem.type === "schedules") {
          throw new Error("לא ניתן לשייך קו הפצה להודעה זו");
        }
      } else if (data.subject && mandatoryAssociationSubjects.includes(data.subject)) {
        // Subjects that require mandatory association must be associated with orders/returns only
        if (!selectedItem) {
          throw new Error("חובה לשייך הזמנה או החזרה להודעת " + data.subject);
        }
        if (selectedItem.type === "schedules") {
          throw new Error("לא ניתן לשייך קו הפצה להודעה זו");
        }
      }

      // Create primary message
      const messageData: any = {
        subject: data.subject || null,
        content: data.content,
        agentnumber: user?.agentnumber,
        tagagent: data.tagagent === "none" ? null : data.tagagent || null,
        correctcustomer: data.correctcustomer || null,
        city: data.city || null,
        ordernumber: data.ordernumber || null,
        returnnumber: data.returnnumber || null,
        schedule_id: data.schedule_id || null
      };

      // Insert the primary message first
      const { data: insertedMessage, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('messages_id')
        .single();
      
      if (messageError) throw messageError;

      const primaryMessageId = insertedMessage.messages_id;

      // Create related messages for selected related items
      if (selectedRelatedItems.length > 0) {
        const relatedMessagesData = selectedRelatedItems.map(item => ({
          subject: data.subject || null,
          content: data.content,
          agentnumber: user?.agentnumber,
          tagagent: data.tagagent === "none" ? null : data.tagagent || null,
          correctcustomer: data.correctcustomer || null,
          city: data.city || null,
          ordernumber: item.type === "orders" ? item.id : null,
          returnnumber: item.type === "returns" ? item.id : null,
          schedule_id: null,
          related_to_message_id: primaryMessageId
        }));

        const { error: relatedMessagesError } = await supabase
          .from('messages')
          .insert(relatedMessagesData);
        
        if (relatedMessagesError) throw relatedMessagesError;
      }

      // Update message_alert for all associated items, except for ice cream return subject
      const allAssociatedItems = [
        ...(selectedItem ? [selectedItem] : []),
        ...selectedRelatedItems
      ];

      for (const item of allAssociatedItems) {
        if (data.subject === "להחזיר הזמנה עם גלידה") {
          // For ice cream return subject, update ignore_icecream instead of message_alert
          if (item.type === "orders") {
            const { error: orderError } = await supabase
              .from('mainorder')
              .update({ ignore_icecream: true })
              .eq('ordernumber', item.id);
            if (orderError) console.warn('Failed to update order ignore_icecream:', orderError);
          } else if (item.type === "returns") {
            const { error: returnError } = await supabase
              .from('mainreturns')
              .update({ ignore_icecream: true })
              .eq('returnnumber', item.id);
            if (returnError) console.warn('Failed to update return ignore_icecream:', returnError);
          }
        } else {
          // For other subjects, update message_alert as usual
          if (item.type === "orders") {
            const { error: orderError } = await supabase
              .from('mainorder')
              .update({ message_alert: true })
              .eq('ordernumber', item.id);
            if (orderError) console.warn('Failed to update order message_alert:', orderError);
          } else if (item.type === "returns") {
            const { error: returnError } = await supabase
              .from('mainreturns')
              .update({ message_alert: true })
              .eq('returnnumber', item.id);
            if (returnError) console.warn('Failed to update return message_alert:', returnError);
          } else if (item.type === "schedules") {
            const { error: scheduleError } = await supabase
              .from('distribution_schedule')
              .update({ message_alert: true })
              .eq('schedule_id', item.id);
            if (scheduleError) console.warn('Failed to update schedule message_alert:', scheduleError);
          }
        }
      }
    },
    onSuccess: () => {
      form.reset();
      setSelectedItem(null);
      setSelectedRelatedItems([]);
      setAssociationError("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['customer-messages'] });
      
      const totalItems = 1 + selectedRelatedItems.length;
      toast({
        title: "הודעה נשלחה בהצלחה!",
        description: `ההודעה נשלחה ושויכה ל-${totalItems} פריטים`,
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

  const handleSearchSelect = (item: SelectedItem, relatedItems?: RelatedItem[]) => {
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

    // Show related items dialog if there are any
    if (relatedItems && relatedItems.length > 0) {
      setPendingRelatedItems(relatedItems);
      setRelatedItemsDialogOpen(true);
    } else {
      setSelectedRelatedItems([]);
    }
  };

  const handleSearchClear = () => {
    setSelectedItem(null);
    setSelectedRelatedItems([]);
    form.setValue("ordernumber", undefined);
    form.setValue("returnnumber", undefined);
    form.setValue("schedule_id", undefined);
  };

  const handleRelatedItemsConfirm = (selectedItems: RelatedItem[]) => {
    setSelectedRelatedItems(selectedItems);
    setRelatedItemsDialogOpen(false);
  };

  const onSubmit = (data: MessageFormData) => {
    // Clear previous association error
    setAssociationError("");
    
    createMessageMutation.mutate(data);
  };

  // Check if "correct customer" field should be shown
  const shouldShowCorrectCustomer = selectedSubject === "הזמנה על לקוח אחר";
  
  // Check if association should be required and what type
  const shouldShowBothAssociation = selectedSubject === "אספקה" || selectedSubject === "מחסן";
  const mandatoryAssociationSubjects = ["לבטל הזמנה", "לדחות", "שינוי מוצרים", "הנחות", "הזמנה על לקוח אחר", "אספקה", "להחזיר הזמנה עם גלידה"];
  const isAssociationRequired = selectedSubject ? mandatoryAssociationSubjects.includes(selectedSubject) : false;
  
  // Check if content and agent tagging should be hidden for ice cream return subject
  const shouldHideContentAndTagging = selectedSubject === "להחזיר הזמנה עם גלידה";


  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 1. נושא ההודעה - ראשון ובולט */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                נושא ההודעה
                <span className="text-sm font-normal text-muted-foreground">(חובה - קובע את שלבי המילוי הבאים)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="subject"
                rules={{ required: "נושא ההודעה נדרש" }}
                render={({ field }) => (
                  <FormItem>
                    <SubjectSelector 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      userAgentNumber={user?.agentnumber}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. שיוך להזמנה/החזרה/קו הפצה - מותנה בנושא */}
          {selectedSubject && (
            <div className="animate-fade-in">
              <Card className={associationError ? "border-destructive/30 bg-destructive/5" : "border-2 border-accent/50 bg-accent/10"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <span className="bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    {shouldShowBothAssociation ? "שיוך להזמנה, החזרה או קו הפצה" : "שיוך להזמנה או החזרה"}
                    {isAssociationRequired && <span className="text-sm font-normal text-destructive">(חובה)</span>}
                    {!isAssociationRequired && <span className="text-sm font-normal text-muted-foreground">(אופציונלי)</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent data-ice-cream-mode={shouldHideContentAndTagging ? "true" : "false"}>
                  <SearchComponent
                    onSelect={handleSearchSelect}
                    selectedItem={selectedItem}
                    onClear={handleSearchClear}
                    allowedTypes={shouldShowBothAssociation ? ["orders", "returns", "schedules"] : ["orders", "returns"]}
                  />
                  {associationError && (
                    <div className="mt-2 text-sm text-destructive font-medium">
                      {associationError}
                    </div>
                  )}
                  
                  {/* Show selected related items */}
                  {selectedRelatedItems.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        פריטים קשורים שנבחרו ({selectedRelatedItems.length}):
                      </h4>
                      <div className="space-y-1">
                        {selectedRelatedItems.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="flex items-center gap-2">
                            <Badge variant={item.type === "orders" ? "default" : "destructive"} className="text-xs">
                              {item.type === "orders" ? `הזמנה #${item.id}` : `החזרה #${item.id}`}
                            </Badge>
                            <span className="text-xs text-green-700">
                              {item.customername} - ₪{item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        ההודעה תחול על כל הפריטים הנבחרים
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. לקוח נכון - רק עבור "הזמנה על לקוח אחר" */}
          {shouldShowCorrectCustomer && (
            <div className="animate-fade-in">
              <Card className="border-2 border-warning/30 bg-warning/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <span className="bg-warning text-warning-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    לקוח נכון
                    <span className="text-sm font-normal text-muted-foreground">(נדרש עבור הזמנה על לקוח אחר)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="correctcustomer"
                    rules={{ required: "יש למלא את שם הלקוח הנכון" }}
                    render={({ field }) => (
                      <FormItem>
                        <CustomerSelector 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          userAgentNumber={user?.agentnumber}
                          onCustomerChange={(customer, isSystem) => {
                            setSelectedCustomer(customer);
                            setIsSystemCustomer(isSystem);
                            // If customer exists in system, set city from customer data
                            if (customer && isSystem) {
                              form.setValue("city", customer.city || "");
                            } else if (!isSystem) {
                              // Clear city when switching to free text
                              form.setValue("city", "");
                            }
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                     )}
                   />
                 </CardContent>
               </Card>

                {/* עיר - תת-שדה של הזמנה על לקוח אחר - רק כשהלקוח לא במערכת */}
                {!isSystemCustomer && (
                  <Card className="border-2 border-warning/20 bg-warning/5 mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <span className="bg-warning/80 text-warning-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3.1</span>
                        עיר
                        <span className="text-sm font-normal text-muted-foreground">(נדרש לחישוב אזור האספקה החדש)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="city"
                        rules={{ required: !isSystemCustomer ? "יש לבחור עיר" : false }}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="בחר עיר" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cities?.map((city) => (
                                  <SelectItem key={city.city} value={city.city}>
                                    {city.city}
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
                )}
                
                {/* הצגת פרטי הלקוח מהמערכת */}
                {isSystemCustomer && selectedCustomer && (
                  <Card className="border-2 border-green-200 bg-green-50 mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                        פרטי הלקוח מהמערכת
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">מספר לקוח:</span> {selectedCustomer.customernumber}
                        </div>
                        <div>
                          <span className="font-medium">שם לקוח:</span> {selectedCustomer.customername || 'ללא שם'}
                        </div>
                        <div>
                          <span className="font-medium">עיר:</span> {selectedCustomer.city || 'לא מוגדר'}
                        </div>
                        <div>
                          <span className="font-medium">כתובת:</span> {selectedCustomer.address || 'לא מוגדר'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
             </div>
           )}

            {/* 4. תייג סוכן - מוסתר עבור נושא גלידה וזמין רק לסוכן 4 */}
           {selectedSubject && !shouldHideContentAndTagging && isAdmin && (
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

          {/* 5. תוכן ההודעה - מוסתר עבור נושא גלידה */}
          {selectedSubject && !shouldHideContentAndTagging && (
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
                <strong>הודעת מחסן:</strong> הודעה פנימית למשרד. שיוך הוא אופציונלי.
              </AlertDescription>
            </Alert>
          )}

          {selectedSubject === "אספקה" && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>הודעת אספקה:</strong> חובה לשייך להזמנה, החזרה או קו הפצה.
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

          {selectedSubject === "להחזיר הזמנה עם גלידה" && (
            <Alert className="border-sky-200 bg-sky-50">
              <AlertCircle className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-800">
                <strong>החזרת הזמנה עם גלידה:</strong> חובה לשייך להזמנה או החזרה עם גלידה. הפעולה תעדכן את הרשומה ותסמן אותה כ"בלי גלידה".
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>

      {/* Related Items Dialog */}
      <RelatedItemsDialog
        open={relatedItemsDialogOpen}
        onOpenChange={setRelatedItemsDialogOpen}
        relatedItems={pendingRelatedItems}
        selectedItem={selectedItem!}
        onConfirm={handleRelatedItemsConfirm}
      />
    </div>
  );
};
