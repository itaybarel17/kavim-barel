
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
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

const SUBJECT_OPTIONS = [
  { value: "לבטל", label: "לבטל" },
  { value: "לדחות", label: "לדחות" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "לקוח אחר", label: "לקוח אחר" }
];

type MessageFormData = {
  subject: string;
  content: string;
  tagagent?: string;
  correctcustomer?: string;
  ordernumber?: number;
  returnnumber?: number;
};

export const MessageForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"orders" | "returns">("orders");

  const form = useForm<MessageFormData>({
    defaultValues: {
      subject: "",
      content: "",
      tagagent: "",
      correctcustomer: "",
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

  // Search orders/returns
  const { data: searchResults } = useQuery({
    queryKey: ['search', searchType, searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      if (searchType === "orders") {
        const { data, error } = await supabase
          .from('mainorder')
          .select('ordernumber, customername, customernumber, orderdate')
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,ordernumber.eq.${parseInt(searchTerm) || 0}`)
          .limit(10);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('mainreturns')
          .select('returnnumber, customername, customernumber, returndate')
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,returnnumber.eq.${parseInt(searchTerm) || 0}`)
          .limit(10);
        if (error) throw error;
        return data;
      }
    },
    enabled: searchTerm.length >= 2
  });

  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const { error } = await supabase
        .from('messages')
        .insert([{
          subject: data.subject,
          content: data.content,
          agentnumber: user?.agentnumber,
          tagagent: data.tagagent || null,
          correctcustomer: data.correctcustomer || null,
          ordernumber: data.ordernumber || null,
          returnnumber: data.returnnumber || null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      form.reset();
      setSearchTerm("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה בהצלחה למערכת",
      });
    },
    onError: (error) => {
      console.error('Error creating message:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההודעה",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: MessageFormData) => {
    createMessageMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="subject"
            rules={{ required: "נושא ההודעה נדרש" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>נושא ההודעה</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר נושא" />
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
                    <SelectItem value="">ללא תיוג</SelectItem>
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

          <FormField
            control={form.control}
            name="correctcustomer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>לקוח נכון (אופציונלי)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="שם הלקוח הנכון..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={createMessageMutation.isPending}
          >
            {createMessageMutation.isPending ? "שולח..." : "שלח הודעה"}
          </Button>
        </form>
      </Form>

      {/* Search Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">חיפוש הזמנות/החזרות לצירוף</h3>
          
          <div className="flex gap-2 mb-4">
            <Select value={searchType} onValueChange={(value: "orders" | "returns") => setSearchType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">הזמנות</SelectItem>
                <SelectItem value="returns">החזרות</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`חפש ${searchType === "orders" ? "הזמנות" : "החזרות"} לפי מספר, שם לקוח או מספר לקוח...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((result: any) => (
                <div 
                  key={searchType === "orders" ? result.ordernumber : result.returnnumber}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (searchType === "orders") {
                      form.setValue("ordernumber", result.ordernumber);
                    } else {
                      form.setValue("returnnumber", result.returnnumber);
                    }
                    setSearchTerm("");
                  }}
                >
                  <div className="font-semibold">
                    {searchType === "orders" ? `הזמנה #${result.ordernumber}` : `החזרה #${result.returnnumber}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.customername} ({result.customernumber})
                  </div>
                  <div className="text-xs text-gray-500">
                    {searchType === "orders" ? result.orderdate : result.returndate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
