import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface ShowMyActivityToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const ShowMyActivityToggle: React.FC<ShowMyActivityToggleProps> = ({
  checked,
  onCheckedChange
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border rounded-lg hover:bg-background/80 transition-all duration-200 shadow-sm">
      <Checkbox
        id="show-my-activity"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label
        htmlFor="show-my-activity"
        className="text-sm md:text-xs lg:text-sm font-medium leading-none cursor-pointer select-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        להציג רק את הפעילות שלך
      </label>
    </div>
  );
};