import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { MobileNav } from './MobileNav';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  actions 
}) => {
  const [location] = useLocation();
  
  // Extract page title from location if not provided
  const pageTitle = title || getPageTitle(location);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background dark">
      {/* Sidebar (hidden on mobile) */}
      <Sidebar className="hidden md:flex" />
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content header */}
        <header className="bg-background-paper shadow-sm pt-2 md:pt-0">
          <div className="flex items-center justify-between p-4 md:py-6 md:px-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              {pageTitle}
            </h1>
            <div className="flex items-center space-x-4">
              {actions}
              
              <Button variant="ghost" size="icon" className="rounded-full bg-background-light hover:bg-muted">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8",
          "pt-16 md:pt-0", // Extra padding for mobile nav
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

function getPageTitle(location: string): string {
  if (location === '/') return 'Dashboard';
  if (location.startsWith('/clients')) return 'Clients';
  if (location.startsWith('/projects')) return 'Projects';
  if (location.startsWith('/invoices')) return 'Invoices';
  if (location.startsWith('/settings')) return 'Settings';
  return 'FreelanceFlow';
}

export default Layout;
