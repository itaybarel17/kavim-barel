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

interface ScheduleResetConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  zoneNumber: number;
}

export const ScheduleResetConfirmDialog: React.FC<ScheduleResetConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  zoneNumber,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>איפוס רשימת אזור {zoneNumber}</AlertDialogTitle>
          <AlertDialogDescription>
            האם לאפס את הרשימה? פעולה זו תחזיר את כל ההזמנות וההחזרות לקנבן האופקי.
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