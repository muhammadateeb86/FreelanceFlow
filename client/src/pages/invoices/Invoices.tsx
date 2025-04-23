import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, FileText, Trash2, CircleCheck, Clock, CircleX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice, Client, Project, InvoiceWithDetails } from '@/types';

const Invoices = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading, refetch } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Fetch clients for mapping client names
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Fetch projects for mapping project names
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/invoices/${id}`),
    onSuccess: () => {
      toast({
        title: 'Invoice deleted',
        description: 'The invoice has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setInvoiceToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete invoice: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiRequest('PUT', `/api/invoices/${id}/status`, { status }),
    onSuccess: () => {
      toast({
        title: 'Status updated',
        description: 'Invoice status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Create invoice with client and project data for display
  const invoicesWithDetails: InvoiceWithDetails[] = invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const project = projects.find(p => p.id === invoice.projectId);
    return { ...invoice, client, project };
  });
  
  // Filter invoices based on search and status
  const filteredInvoices = invoicesWithDetails.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.client?.companyName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.project?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle status change
  const handleStatusChange = (invoiceId: number, status: string) => {
    updateInvoiceStatusMutation.mutate({ id: invoiceId, status });
  };
  
  const isLoading = invoicesLoading || clientsLoading || projectsLoading;
  
  return (
    <Layout title="Invoices">
      <Card className="bg-background-paper shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="w-full pl-8 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="All Invoices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => refetch()}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <RefreshCw className="h-5 w-5 mx-auto animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      No invoices found.
                      {search && ' Try a different search term.'}
                      {!search && ' Create a project and generate an invoice to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-white">
                        <Link href={`/invoices/${invoice.id}`}>
                          <a className="hover:underline">{invoice.invoiceNumber}</a>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.client?.companyName || `Client #${invoice.clientId}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.project?.name || `Project #${invoice.projectId}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-white">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value)}
                        >
                          <SelectTrigger className="h-8 w-[110px] bg-background">
                            <SelectValue>
                              <InvoiceStatusBadge status={invoice.status} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                                <span>Pending</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="paid">
                              <div className="flex items-center">
                                <CircleCheck className="h-3.5 w-3.5 mr-2 text-green-400" />
                                <span>Paid</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="overdue">
                              <div className="flex items-center">
                                <CircleX className="h-3.5 w-3.5 mr-2 text-red-400" />
                                <span>Overdue</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            className="h-8 w-8 text-primary"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setInvoiceToDelete(invoice)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredInvoices.length > 0 && (
            <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredInvoices.length}</span> of{' '}
                <span className="font-medium">{invoices.length}</span> invoices
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!invoiceToDelete} 
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{invoiceToDelete?.invoiceNumber}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => invoiceToDelete && deleteInvoiceMutation.mutate(invoiceToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoiceMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

interface StatusBadgeProps {
  status: string;
}

const InvoiceStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'paid':
      return (
        <div className="flex items-center">
          <CircleCheck className="h-3.5 w-3.5 mr-2 text-green-400" />
          <span>Paid</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center">
          <Clock className="h-3.5 w-3.5 mr-2 text-yellow-400" />
          <span>Pending</span>
        </div>
      );
    case 'overdue':
      return (
        <div className="flex items-center">
          <CircleX className="h-3.5 w-3.5 mr-2 text-red-400" />
          <span>Overdue</span>
        </div>
      );
    default:
      return (
        <div className="text-muted-foreground">
          {status}
        </div>
      );
  }
};

export default Invoices;
