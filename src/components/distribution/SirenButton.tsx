
import React from 'react';
import { Siren } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SirenButtonProps {
  type: 'order' | 'return';
  itemId: number;
  alertStatus?: boolean;
  onStatusChange?: () => void;
}

export const SirenButton: React.FC<SirenButtonProps> = ({
  type,
  itemId,
  alertStatus = false,
  onStatusChange
}) => {
  const { toast } = useToast();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card drag when clicking button
    
    try {
      const newStatus = !alertStatus;
      
      if (type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ alert_status: newStatus })
          .eq('ordernumber', itemId);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ alert_status: newStatus })
          .eq('returnnumber', itemId);
          
        if (error) throw error;
      }
      
      onStatusChange?.();
      
      toast({
        title: newStatus ? "התראה הופעלה" : "התראה בוטלה",
        description: `${type === 'order' ? 'הזמנה' : 'החזרה'} #${itemId}`,
      });
      
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את מצב ההתראה",
        variant: "destructive"
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        p-1 rounded-full transition-all duration-300 transform hover:scale-110
        ${alertStatus 
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
      title={alertStatus ? "בטל התראה" : "הפעל התראה"}
    >
      <Siren 
        size={14} 
        className={alertStatus ? 'animate-pulse' : ''} 
      />
    </button>
  );
};
