import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Send, 
  RefreshCw 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate, centsToDollars } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Invoice, Client, Project, Workday, SendInvoiceEmailInput } from '@/types';

interface InvoicePreviewProps {
  invoiceId: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // States for email form
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  
  // Fetch invoice data
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });
  
  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: invoice ? [`/api/clients/${invoice.clientId}`] : null,
    enabled: !!invoice,
  });
  
  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: invoice ? [`/api/projects/${invoice.projectId}`] : null,
    enabled: !!invoice,
  });
  
  // Fetch workdays for this invoice
  const { data: workdays = [], isLoading: workdaysLoading } = useQuery<Workday[]>({
    queryKey: invoice ? [`/api/projects/${invoice.projectId}/workdays`] : null,
    enabled: !!invoice && !!project,
  });
  
  // Send invoice email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (data: SendInvoiceEmailInput) => 
      apiRequest('POST', `/api/invoices/${invoiceId}/send`, data),
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Invoice has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send invoice: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Download PDF invoice
  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };
  
  // Send invoice email
  const handleSendEmail = () => {
    if (!recipient || !subject || !message) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all email fields before sending.',
        variant: 'destructive',
      });
      return;
    }
    
    const emailData: SendInvoiceEmailInput = {
      recipient,
      subject,
      message,
      attachPdf,
      userEmail,
      userPassword,
    };
    
    sendEmailMutation.mutate(emailData);
  };
  
  // Set default email values when data is loaded
  if (client && invoice && project && !recipient && !subject && !message) {
    setRecipient(client.billingEmail);
    setSubject(`Invoice #${invoice.invoiceNumber} for ${project.name}`);
    setMessage(
`Dear ${client.contactPerson || client.companyName},

Please find attached invoice #${invoice.invoiceNumber} for the ${project.name}. The invoice is due on ${formatDate(invoice.dueDate)}.

If you have any questions regarding this invoice, please don't hesitate to contact me.

Thank you for your business.

Best regards,
John Doe`
    );
  }
  
  // Button to go back to invoices list
  const actions = (
    <Button 
      variant="ghost" 
      onClick={() => navigate('/invoices')}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Invoices
    </Button>
  );
  
  const isLoading = invoiceLoading || clientLoading || projectLoading || workdaysLoading;
  
  if (isLoading) {
    return (
      <Layout title="Loading Invoice..." actions={actions}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!invoice || !client || !project) {
    return (
      <Layout title="Invoice Not Found" actions={actions}>
        <Card className="bg-background-paper shadow-lg">
          <CardContent className="p-6 text-center">
            <p>The requested invoice could not be found.</p>
            <Button 
              onClick={() => navigate('/invoices')} 
              className="mt-4"
            >
              Return to Invoices
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }
  
  // Filter workdays that are part of this invoice
  const invoiceWorkdays = workdays.filter(workday => 
    invoice.workdaysIds.includes(workday.id)
  );
  
  return (
    <Layout title="Invoice Preview" actions={actions}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Invoice #{invoice.invoiceNumber}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <Button 
            variant="secondary" 
            className="flex items-center"
            onClick={handleDownloadPdf}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            className="flex items-center"
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invoice
          </Button>
        </div>
      </div>
      
      {/* Invoice Preview */}
      <Card className="bg-white text-gray-800 rounded-lg shadow-lg mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between mb-10">
            <div>
              <div className="text-3xl font-bold text-gray-800 mb-1">INVOICE</div>
              <div className="text-gray-600">#{invoice.invoiceNumber}</div>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <div className="text-lg font-bold text-gray-800 mb-1">FreelanceFlow</div>
              <div className="text-gray-600">123 Main Street</div>
              <div className="text-gray-600">New York, NY 10001</div>
              <div className="text-gray-600">contact@freelanceflow.com</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <div className="text-sm text-gray-500 uppercase font-medium mb-2">Bill To:</div>
              <div className="text-gray-800 font-medium">{client.companyName}</div>
              {client.contactPerson && (
                <div className="text-gray-600">Attn: {client.contactPerson}</div>
              )}
              {client.address && (
                <div className="text-gray-600">{client.address}</div>
              )}
              <div className="text-gray-600">{client.billingEmail}</div>
            </div>
            
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 uppercase font-medium mb-2">Invoice Date:</div>
                  <div className="text-gray-800">{formatDate(invoice.invoiceDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 uppercase font-medium mb-2">Invoice Due:</div>
                  <div className="text-gray-800">{formatDate(invoice.dueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 uppercase font-medium mb-2">Project:</div>
                  <div className="text-gray-800">{project.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 uppercase font-medium mb-2">Amount Due:</div>
                  <div className="text-gray-800 font-bold">{formatCurrency(invoice.amount)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-10">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th scope="col" className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {project.type === 'daily_rate' ? (
                  // For daily rate projects, show each workday
                  invoiceWorkdays.map((workday, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <div className="text-sm text-gray-900">
                          Daily Rate - {formatDate(workday.date)}
                        </div>
                      </td>
                      <td className="py-4 text-center text-sm text-gray-500">
                        {formatCurrency(project.rate)}
                      </td>
                      <td className="py-4 text-center text-sm text-gray-500">1</td>
                      <td className="py-4 text-right text-sm text-gray-900">
                        {formatCurrency(project.rate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  // For fixed price projects, show one line item
                  <tr>
                    <td className="py-4">
                      <div className="text-sm text-gray-900">{project.name} - Fixed Price</div>
                    </td>
                    <td className="py-4 text-center text-sm text-gray-500">
                      {formatCurrency(project.rate)}
                    </td>
                    <td className="py-4 text-center text-sm text-gray-500">1</td>
                    <td className="py-4 text-right text-sm text-gray-900">
                      {formatCurrency(project.rate)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <div className="w-full md:w-64">
              <div className="flex justify-between py-2">
                <div className="text-sm text-gray-500">Subtotal:</div>
                <div className="text-sm text-gray-800">{formatCurrency(invoice.amount)}</div>
              </div>
              <div className="flex justify-between py-2">
                <div className="text-sm text-gray-500">Tax (0%):</div>
                <div className="text-sm text-gray-800">$0.00</div>
              </div>
              <div className="flex justify-between py-2 font-bold border-t border-gray-200">
                <div className="text-gray-800">Total:</div>
                <div className="text-primary">{formatCurrency(invoice.amount)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Notes:</div>
            <div className="text-sm text-gray-600">
              {invoice.notes || "Thank you for your business! Payment is due within 14 days of invoice date."}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Please make payment via bank transfer to the following account:
            </div>
            <div className="text-sm text-gray-600 mt-1">Bank: Example Bank</div>
            <div className="text-sm text-gray-600">Account Name: FreelanceFlow Inc.</div>
            <div className="text-sm text-gray-600">Account Number: XXXX-XXXX-XXXX-1234</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Form */}
      <Card className="bg-background-paper shadow-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Send Invoice</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-muted-foreground mb-1">
              Recipient *
            </label>
            <Select 
              value={recipient} 
              onValueChange={setRecipient}
            >
              <SelectTrigger id="recipient" className="bg-background">
                <SelectValue placeholder="Select an email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={client.billingEmail}>
                  {client.billingEmail} (Billing Email)
                </SelectItem>
                {client.emails.map((email, index) => (
                  <SelectItem key={index} value={email}>
                    {email}
                  </SelectItem>
                ))}
                {client.contactPerson && client.emails.length > 0 && (
                  <SelectItem value={client.emails[0]}>
                    {client.emails[0]} (Contact Person)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1">
              Subject *
            </label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
              Message *
            </label>
            <Textarea 
              id="message" 
              rows={5} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="bg-background resize-none"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="attach-pdf" 
              checked={attachPdf} 
              onCheckedChange={(checked) => setAttachPdf(!!checked)} 
            />
            <label htmlFor="attach-pdf" className="text-sm text-muted-foreground cursor-pointer">
              Attach PDF Invoice
            </label>
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-muted-foreground mb-1">
              Your Email *
            </label>
            <Input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="bg-background"
            />
          </div>

          <div>
            <label htmlFor="userPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              Email Password *
            </label>
            <Input
              id="userPassword"
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending || !recipient || !subject || !message}
              className="flex items-center"
            >
              {sendEmailMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Invoice
            </Button>
          </div>
        </div>
      </Card>
    </Layout>
  );
};

export default InvoicePreview;
