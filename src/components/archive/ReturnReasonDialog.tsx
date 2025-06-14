
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface ReturnReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: { type: string; responsible: string }) => void;
  itemType: 'order' | 'return';
  itemNumber: number;
}

export const ReturnReasonDialog: React.FC<ReturnReasonDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  itemType,
  itemNumber
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [returnType, setReturnType] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');

  const handleClose = () => {
    setStep(1);
    setReturnType('');
    setResponsible('');
    onOpenChange(false);
  };

  const handleNext = () => {
    if (returnType && step === 1) {
      setStep(2);
    }
  };

  const handleConfirm = () => {
    if (returnType && responsible) {
      onConfirm({ type: returnType, responsible });
      handleClose();
    }
  };

  const handleBack = () => {
    setStep(1);
    setResponsible('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              החזרה ל{itemType === 'order' ? 'הזמנה' : 'החזרה'} #{itemNumber}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">סיבת החזרה:</h3>
              <RadioGroup value={returnType} onValueChange={setReturnType}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="חזר" id="returned" />
                  <Label htmlFor="returned">חזר</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="נשאר" id="remained" />
                  <Label htmlFor="remained">נשאר</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                ביטול
              </Button>
              <Button onClick={handleNext} disabled={!returnType}>
                הבא
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">מי אחראי:</h3>
              <RadioGroup value={responsible} onValueChange={setResponsible}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="נהג" id="driver" />
                  <Label htmlFor="driver">נהג</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="לקוח" id="customer" />
                  <Label htmlFor="customer">לקוח</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="משרד" id="office" />
                  <Label htmlFor="office">משרד</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                חזרה
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  ביטול
                </Button>
                <Button onClick={handleConfirm} disabled={!responsible}>
                  אישור החזרה
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
