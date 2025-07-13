import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RelatedItem = {
  type: "orders" | "returns";
  id: number;
  customername: string;
  customernumber: string;
  amount: number;
  date: string;
  agentnumber: string;
};

interface RelatedItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedItems: RelatedItem[];
  selectedItem: {
    type: "orders" | "returns" | "schedules";
    id: number;
    title: string;
    subtitle: string;
  };
  onConfirm: (selectedRelatedItems: RelatedItem[]) => void;
}

export const RelatedItemsDialog: React.FC<RelatedItemsDialogProps> = ({
  open,
  onOpenChange,
  relatedItems,
  selectedItem,
  onConfirm
}) => {
  const [selectedItems, setSelectedItems] = useState<RelatedItem[]>([]);

  const handleItemToggle = (item: RelatedItem, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => !(i.type === item.type && i.id === item.id)));
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedItems);
    setSelectedItems([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems([]);
    onOpenChange(false);
  };

  const formatAmount = (amount: number) => {
    return `₪${amount?.toLocaleString('he-IL') || '0'}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getItemTypeLabel = (type: "orders" | "returns") => {
    return type === "orders" ? "הזמנה" : "החזרה";
  };

  const getItemNumber = (item: RelatedItem) => {
    return item.type === "orders" ? `הזמנה #${item.id}` : `החזרה #${item.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-right">
            פריטים קשורים נמצאו
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>נבחר:</strong> {selectedItem.title}
            </p>
            <p className="text-sm text-blue-700">
              {selectedItem.subtitle}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              נמצאו {relatedItems.length} פריטים קשורים לאותו לקוח/עיר:
            </h3>
            
            {relatedItems.map((item) => {
              const isSelected = selectedItems.some(
                i => i.type === item.type && i.id === item.id
              );
              
              return (
                <Card key={`${item.type}-${item.id}`} className="border-2 hover:bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemToggle(item, checked === true)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.type === "orders" ? "default" : "destructive"}>
                              {getItemTypeLabel(item.type)}
                            </Badge>
                            <span className="font-semibold">
                              {getItemNumber(item)}
                            </span>
                          </div>
                          <span className="font-bold text-green-600">
                            {formatAmount(item.amount)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p><strong>לקוח:</strong> {item.customername} ({item.customernumber})</p>
                          <div className="flex gap-4">
                            <span><strong>תאריך:</strong> {formatDate(item.date)}</span>
                            <span><strong>סוכן:</strong> {item.agentnumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>הסבר:</strong> אם תבחר לשייך פריטים נוספים, ההודעה תחול על כל הפריטים הנבחרים.
              התוויות וההבהובים יופיעו על כל הפריטים, אך הערת "לתשומת לב המחסן" תופיע רק על הפריט הראשון.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button onClick={handleConfirm} className="px-6">
            שייך {selectedItems.length > 0 ? `(${selectedItems.length + 1} פריטים)` : '(פריט אחד בלבד)'}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};