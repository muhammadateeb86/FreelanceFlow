import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'success' | 'info';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  color,
  className
}) => {
  return (
    <div className={cn(
      "bg-background-paper rounded-lg shadow-lg p-6",
      className
    )}>
      <div className="flex items-center">
        <div className={cn(
          "rounded-full w-12 h-12 flex items-center justify-center",
          {
            'bg-primary bg-opacity-20': color === 'primary',
            'bg-secondary bg-opacity-20': color === 'secondary',
            'bg-green-600 bg-opacity-20': color === 'success',
            'bg-purple-600 bg-opacity-20': color === 'info',
          }
        )}>
          <Icon className={cn(
            "h-6 w-6",
            {
              'text-primary': color === 'primary',
              'text-secondary': color === 'secondary',
              'text-green-500': color === 'success',
              'text-purple-500': color === 'info',
            }
          )} />
        </div>
        <div className="ml-4">
          <div className="text-muted-foreground text-sm">{title}</div>
          <div className="text-2xl font-medium text-white">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
