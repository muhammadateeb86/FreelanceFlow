import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-full bg-background-paper border-r border-border dark",
      className,
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold">FF</span>
          </div>
          {!collapsed && (
            <div className="text-xl text-white font-medium">FreelanceFlow</div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-md"
        >
          {collapsed ? <ChevronLast size={18} /> : <ChevronFirst size={18} />}
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="px-2 py-4 space-y-1">
          <NavLink
            to="/"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={location === '/'}
            collapsed={collapsed}
          />
          
          <NavLink
            to="/clients"
            icon={<Users className="h-5 w-5" />}
            label="Clients"
            active={location.startsWith('/clients')}
            collapsed={collapsed}
          />
          
          <NavLink
            to="/projects"
            icon={<FolderKanban className="h-5 w-5" />}
            label="Projects"
            active={location.startsWith('/projects')}
            collapsed={collapsed}
          />
          
          <NavLink
            to="/invoices"
            icon={<FileText className="h-5 w-5" />}
            label="Invoices"
            active={location.startsWith('/invoices')}
            collapsed={collapsed}
          />
          
          <NavLink
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            active={location === '/settings'}
            collapsed={collapsed}
          />
        </nav>
      </ScrollArea>
      
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary-dark text-primary-foreground">
              JD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <div className="text-sm font-medium text-white">John Doe</div>
              <div className="text-xs text-muted-foreground">john@example.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  to,
  icon,
  label,
  active,
  collapsed = false
}) => {
  return (
    <Link href={to}>
      <a className={cn(
        "group flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
      )}>
        <span className="shrink-0 mr-3">
          {icon}
        </span>
        {!collapsed && (
          <span>{label}</span>
        )}
      </a>
    </Link>
  );
};

export default Sidebar;
