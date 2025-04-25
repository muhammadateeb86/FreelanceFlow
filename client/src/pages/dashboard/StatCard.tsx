import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // Updated to accept gradient classes (e.g., 'from-blue-500 to-indigo-600')
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-background-paper rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:scale-105",
        className,
      )}
    >
      <div className="flex items-center">
        <div
          className={cn(
            "rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br",
            color, // e.g., 'from-blue-500 to-indigo-600'
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <div className="text-gray-400 text-sm">{title}</div>
          <div className="text-2xl font-medium text-white transition-all duration-500">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
