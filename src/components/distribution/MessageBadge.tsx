import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBadgeProps {
  subject: string;
  isBlinking: boolean;
  onClick: () => void;
  content?: string;
  tagAgent?: string;
  agentName?: string;
}

export const MessageBadge: React.FC<MessageBadgeProps> = ({
  subject,
  isBlinking,
  onClick,
  content,
  tagAgent,
  agentName
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Define colors based on subject
  const getSubjectColors = (subject: string) => {
    switch (subject) {
      case 'לבטל הזמנה':
        return 'bg-red-600 text-black border-red-700 hover:bg-red-700 hover:text-white';
      case 'לדחות':
        return 'bg-red-600 text-white border-red-700 hover:bg-red-700';
      default:
        return 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600';
    }
  };

  const colorClasses = getSubjectColors(subject);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Badge
          className={cn(
            'cursor-pointer transition-all duration-200 px-2 py-1 text-xs font-bold border-2 shadow-md hover:shadow-lg active:scale-95',
            colorClasses,
            isBlinking && 'animate-pulse-slow shadow-lg'
          )}
          onClick={onClick}
        >
          {subject}
        </Badge>
        <Info 
          className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onClick={handleInfoClick}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              פרטי הודעה
              <DialogClose asChild>
                <button className="h-4 w-4 opacity-70 hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">נושא:</p>
              <p className="text-sm">{subject}</p>
            </div>
            {content && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">תוכן ההודעה:</p>
                <p className="text-sm">{content}</p>
              </div>
            )}
            {tagAgent && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">סוכן מתויג:</p>
                <p className="text-sm">{agentName || tagAgent}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};