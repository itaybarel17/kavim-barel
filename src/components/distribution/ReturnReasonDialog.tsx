
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReturnReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: { action: string; entity: string }) => void;
  itemType: 'order' | 'return';
  itemNumber: number;
}

export const ReturnReasonDialog: React.FC<ReturnReasonDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  itemType,
  itemNumber,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [action, setAction] = useState<string>('');

  const handleActionSelect = (selectedAction: string) => {
    setAction(selectedAction);
    setStep(2);
  };

  const handleEntitySelect = (entity: string) => {
    onConfirm({ action, entity });
    onOpenChange(false);
    setStep(1);
    setAction('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setAction('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            החזרת {itemType === 'order' ? 'הזמנה' : 'החזרה'} #{itemNumber}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'בחר מה קרה עם הפריט:'
              : 'מי החליט על הפעולה?'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => handleActionSelect('חזר')}
              className="text-right"
            >
              חזר למחסן
            </Button>
            <Button
              variant="outline"
              onClick={() => handleActionSelect('נשאר')}
              className="text-right"
            >
              נשאר אצל הלקוח
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => handleEntitySelect('נהג')}
              className="text-right"
            >
              החלטת נהג
            </Button>
            <Button
              variant="outline"
              onClick={() => handleEntitySelect('לקוח')}
              className="text-right"
            >
              החלטת לקוח
            </Button>
            <Button
              variant="outline"
              onClick={() => handleEntitySelect('משרד')}
              className="text-right"
            >
              החלטת משרד
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            ביטול
          </Button>
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)}>
              חזור
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
