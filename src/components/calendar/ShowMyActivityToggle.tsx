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
    <div className="flex items-center space-x-2 space-x-reverse">
      <Checkbox
        id="show-my-activity"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <label
        htmlFor="show-my-activity"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        להציג רק את הפעילות שלך
      </label>
    </div>
  );
};