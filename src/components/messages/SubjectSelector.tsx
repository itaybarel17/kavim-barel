import { MessageSquare, Package, AlertTriangle, Users, Truck, Archive, Building } from "lucide-react";

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  userAgentNumber?: string;
}

const SUBJECT_OPTIONS = [
  { 
    value: 'לבטל הזמנה', 
    label: 'לבטל הזמנה',
    icon: AlertTriangle,
    color: 'bg-destructive/10 hover:bg-destructive/20 border-destructive/20 text-destructive'
  },
  { 
    value: 'לדחות', 
    label: 'לדחות',
    icon: Archive,
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'
  },
  { 
    value: 'שינוי מוצרים', 
    label: 'שינוי מוצרים',
    icon: Package,
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
  },
  { 
    value: 'הנחות', 
    label: 'הנחות',
    icon: Package,
    color: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300'
  },
  { 
    value: 'אספקה', 
    label: 'אספקה',
    icon: Truck,
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
  },
  { 
    value: 'הזמנה על לקוח אחר', 
    label: 'הזמנה על לקוח אחר',
    icon: Users,
    color: 'bg-amber-100 hover:bg-amber-200 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300'
  },
  { 
    value: 'מחסן', 
    label: 'מחסן',
    icon: Building,
    color: 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 dark:border-gray-800 dark:text-gray-300'
  }
];

export function SubjectSelector({ value, onChange, userAgentNumber }: SubjectSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        נושא ההודעה *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBJECT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          const isWarehouseForNonAgent4 = option.value === "מחסן" && userAgentNumber !== "4";
          
          if (isWarehouseForNonAgent4) {
            return null; // Hide warehouse button for non-agent-4 users
          }
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-right
                ${isSelected 
                  ? option.color + ' ring-2 ring-primary/50 shadow-md scale-105' 
                  : option.color + ' opacity-70 hover:opacity-100'
                }
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}