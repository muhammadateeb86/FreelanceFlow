import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import StatCard from './StatCard';
import { 
  FolderKanban, 
  Users, 
  FileText, 
  DollarSign,
  ChevronRight,
  CircleCheck,
  Clock,
  CircleX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Client, DashboardStats, InvoiceWithDetails, ProjectWithClient } from '@/types';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalClients: 0,
    invoicesSent: 0,
    totalEarnings: 0
  });
  
  // Fetch clients
  const { data: clients = [], refetch: refetchClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    refetchOnWindowFocus: true,
    staleTime: 0 // Always treat data as stale to force refetch
  });
  
  // Fetch projects with their client data
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery<ProjectWithClient[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Fetch recent invoices with client and project data
  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<InvoiceWithDetails[]>({
    queryKey: ['/api/invoices'],
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Force refresh data when component mounts
  useEffect(() => {
    const refreshData = async () => {
      await refetchClients();
      await refetchProjects();
      await refetchInvoices();
    };
    
    refreshData();
  }, [refetchClients, refetchProjects, refetchInvoices]);
  
  // Calculate dashboard stats
  useEffect(() => {
    // Always calculate stats regardless of whether any arrays have elements
    // This ensures we show zero values properly
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const totalClients = clients.length;
    const invoicesSent = invoices.length;
    const totalEarnings = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    
    setStats({
      activeProjects,
      totalClients,
      invoicesSent,
      totalEarnings
    });
    
    console.log('Dashboard stats updated:', {
      activeProjects,
      totalClients,
      invoicesSent,
      totalEarnings
    });
  }, [projects, clients, invoices]);
  
  // Get recent projects (sorted by creation date)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  
  // Get recent invoices (sorted by creation date)
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  
  return (
    <Layout>
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <StatCard 
          title="Active Projects" 
          value={stats.activeProjects} 
          icon={FolderKanban} 
          color="primary"
        />
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients} 
          icon={Users} 
          color="secondary"
        />
        <StatCard 
          title="Invoices Sent" 
          value={stats.invoicesSent} 
          icon={FileText} 
          color="success"
        />
        <StatCard 
          title="Total Earnings" 
          value={formatCurrency(stats.totalEarnings)} 
          icon={DollarSign} 
          color="info"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 bg-background-paper shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
          <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Recent Projects</CardTitle>
            <Link href="/projects">
              <a className="text-primary text-sm hover:underline flex items-center">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        Loading projects...
                      </TableCell>
                    </TableRow>
                  ) : recentProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No projects found. <Link href="/projects/new"><a className="text-primary hover:underline">Create one</a></Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium text-white">
                          <Link href={`/projects/${project.id}`}>
                            <a className="hover:underline">{project.name}</a>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.client?.companyName || `Client #${project.clientId}`}
                        </TableCell>
                        <TableCell>
                          <ProjectStatusBadge status={project.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.type === 'daily_rate' ? 'Daily Rate' : 'Fixed Price'}
                        </TableCell>
                        <TableCell className="text-right text-white">
                          {project.type === 'daily_rate' 
                            ? `${formatCurrency(project.rate)}/day` 
                            : formatCurrency(project.rate)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Invoices */}
        <Card className="bg-background-paper shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200">
          <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Recent Invoices</CardTitle>
            <Link href="/invoices">
              <a className="text-primary text-sm hover:underline flex items-center">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invoicesLoading ? (
                <div className="p-4 text-center">
                  Loading invoices...
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="p-4 text-center">
                  No invoices found
                </div>
              ) : (
                recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 hover:bg-muted/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-white">
                          <Link href={`/invoices/${invoice.id}`}>
                            <a className="hover:underline">{invoice.invoiceNumber}</a>
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.client?.companyName || `Client #${invoice.clientId}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {formatCurrency(invoice.amount)}
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Sent on {formatDate(invoice.invoiceDate)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

interface StatusBadgeProps {
  status: string;
}

const ProjectStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'open':
      return (
        <Badge className="bg-blue-900 text-blue-300 hover:bg-blue-900">
          Open
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-green-900 text-green-300 hover:bg-green-900">
          In Progress
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-purple-900 text-purple-300 hover:bg-purple-900">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

const InvoiceStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'paid':
      return (
        <div className="text-xs text-green-400 flex items-center">
          <CircleCheck className="h-3 w-3 mr-1" /> Paid
        </div>
      );
    case 'pending':
      return (
        <div className="text-xs text-yellow-400 flex items-center">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </div>
      );
    case 'overdue':
      return (
        <div className="text-xs text-red-400 flex items-center">
          <CircleX className="h-3 w-3 mr-1" /> Overdue
        </div>
      );
    default:
      return (
        <div className="text-xs text-muted-foreground">
          {status}
        </div>
      );
  }
};

export default Dashboard;
