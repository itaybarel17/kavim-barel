import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomerChange?: (customer: Customer | null, isSystemCustomer: boolean) => void;
  userAgentNumber?: string;
}

interface Customer {
  customernumber: string;
  customername: string | null;
  city: string | null;
  address: string | null;
}

export function CustomerSelector({ value, onChange, onCustomerChange, userAgentNumber }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSystemCustomer, setIsSystemCustomer] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch customers from database
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, userAgentNumber],
    queryFn: async () => {
      if (!searchTerm.trim() || !isSystemCustomer) return [];
      
      let query = supabase
        .from('customerlist')
        .select('customernumber, customername, city, address, agentnumber')
        .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%`);
      
      // Filter by agent - agent 4 can see all customers, others see only their own
      if (userAgentNumber && userAgentNumber !== "4") {
        query = query.eq('agentnumber', userAgentNumber);
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!searchTerm.trim() && isSystemCustomer
  });

  const handleCustomerSelect = (customer: Customer) => {
    onChange(customer.customername || customer.customernumber);
    setSearchTerm("");
    setIsOpen(false);
    onCustomerChange?.(customer, true);
  };

  const handleFreeTextChange = (text: string) => {
    onChange(text);
    setSearchTerm(text);
    onCustomerChange?.(null, false);
  };

  const handleSystemToggle = (checked: boolean) => {
    setIsSystemCustomer(checked);
    if (!checked) {
      // Switch to free text mode
      setSearchTerm(value);
      setIsOpen(false);
      onCustomerChange?.(null, false);
    } else {
      // Switch to system search mode
      setSearchTerm("");
      onChange("");
      onCustomerChange?.(null, true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="customer-toggle" className="text-sm font-medium">
          לקוח נכון
        </Label>
        <div className="flex items-center gap-2">
          <Label htmlFor="customer-toggle" className="text-xs text-muted-foreground">
            הלקוח קיים במערכת?
          </Label>
          <Switch
            id="customer-toggle"
            checked={isSystemCustomer}
            onCheckedChange={handleSystemToggle}
          />
        </div>
      </div>

      {isSystemCustomer ? (
        <div className="relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לקוח לפי שם או מספר..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pr-10"
            />
          </div>

          {isOpen && searchTerm && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  מחפש...
                </div>
              ) : customers && customers.length > 0 ? (
                <div className="p-1">
                  {customers.map((customer) => (
                    <button
                      key={customer.customernumber}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-3 text-right hover:bg-accent rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs">
                          {customer.customernumber}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {customer.customername || 'ללא שם'}
                          </div>
                          {customer.city && (
                            <div className="text-xs text-muted-foreground">
                              {customer.city}
                              {customer.address && `, ${customer.address}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  לא נמצאו תוצאות
                </div>
              )}
            </Card>
          )}

          {value && isSystemCustomer && (
            <div className="mt-2 p-2 bg-accent rounded-md flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">{value}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  setSearchTerm("");
                }}
                className="mr-auto h-6 px-2"
              >
                הסר
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <Input
            placeholder="הזן שם לקוח..."
            value={value}
            onChange={(e) => handleFreeTextChange(e.target.value)}
          />
          {value && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              לקוח שלא במערכת
            </div>
          )}
        </div>
      )}
    </div>
  );
}