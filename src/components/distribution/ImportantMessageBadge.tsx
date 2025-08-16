import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportantMessageBadgeProps {
  onClick: () => void;
  content?: string;
  tagAgent?: string;
  agentName?: string;
  shouldBlink?: boolean;
}

export const ImportantMessageBadge: React.FC<ImportantMessageBadgeProps> = ({
  onClick,
  content,
  tagAgent,
  agentName,
  shouldBlink = true
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
            'bg-purple-600 text-white border-purple-700 hover:bg-purple-700',
            shouldBlink && 'animate-pulse-slow shadow-lg'
          )}
          onClick={onClick}
        >
          הודעה חשובה
        </Badge>
        <MessageCircle 
          className="h-4 w-4 cursor-pointer transition-all duration-200 hover:scale-110 text-purple-600 hover:text-purple-700"
          onClick={handleInfoClick}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              פרטי הודעה חשובה
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">נושא:</p>
              <p className="text-sm">הודעה חשובה ללוח זמנים</p>
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