import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings,
  Bell
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-background-paper z-20 shadow-md">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold">FF</span>
          </div>
          <div className="text-xl text-white font-medium">FreelanceFlow</div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="p-4 flex items-center border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-bold">FF</span>
                  </div>
                  <div className="text-xl text-white font-medium">FreelanceFlow</div>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <nav className="px-2 py-4 space-y-1">
                  <NavLink
                    to="/"
                    icon={<LayoutDashboard className="h-5 w-5" />}
                    label="Dashboard"
                    active={location === '/'}
                    onClick={() => setOpen(false)}
                  />
                  
                  <NavLink
                    to="/clients"
                    icon={<Users className="h-5 w-5" />}
                    label="Clients"
                    active={location.startsWith('/clients')}
                    onClick={() => setOpen(false)}
                  />
                  
                  <NavLink
                    to="/projects"
                    icon={<FolderKanban className="h-5 w-5" />}
                    label="Projects"
                    active={location.startsWith('/projects')}
                    onClick={() => setOpen(false)}
                  />
                  
                  <NavLink
                    to="/invoices"
                    icon={<FileText className="h-5 w-5" />}
                    label="Invoices"
                    active={location.startsWith('/invoices')}
                    onClick={() => setOpen(false)}
                  />
                  
                  <NavLink
                    to="/settings"
                    icon={<Settings className="h-5 w-5" />}
                    label="Settings"
                    active={location === '/settings'}
                    onClick={() => setOpen(false)}
                  />
                </nav>
              </ScrollArea>
              
              <div className="px-4 py-4 border-t border-border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary-dark text-primary-foreground">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-white">John Doe</div>
                    <div className="text-xs text-muted-foreground">john@example.com</div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({
  to,
  icon,
  label,
  active,
  onClick
}) => {
  return (
    <Link href={to}>
      <a 
        className={cn(
          "group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors",
          active 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
        )}
        onClick={onClick}
      >
        <span className="shrink-0 mr-3">
          {icon}
        </span>
        <span>{label}</span>
      </a>
    </Link>
  );
};
