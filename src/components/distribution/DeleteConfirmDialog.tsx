
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { type: 'order' | 'return'; data: Order | Return } | null;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  item,
  onConfirm,
}) => {
  if (!item) return null;

  const isOrder = item.type === 'order';
  const number = isOrder ? (item.data as Order).ordernumber : (item.data as Return).returnnumber;
  const itemType = isOrder ? 'הזמנה' : 'החזרה';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת {itemType}</AlertDialogTitle>
          <AlertDialogDescription>
            האם למחוק את {itemType} #{number}?
            <br />
            פעולה זו תעביר את {itemType} לארכיון.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>לא</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>כן</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
