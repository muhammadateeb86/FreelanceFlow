import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, X, Plus, RefreshCw } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { generateUniqueId, isValidEmail } from '@/lib/utils';
import { Client, CreateClientInput } from '@/types';

// Schema for the client form
const clientFormSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  contactPerson: z.string().optional(),
  billingEmail: z.string().email({
    message: "Please enter a valid email address for billing.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  clientId?: string;
}

const ClientForm: React.FC<ClientFormProps> = ({ clientId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!clientId;
  
  // State for additional emails (not part of the react-hook-form)
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  
  // Fetch client data if in edit mode
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: isEditMode,
  });
  
  // Set up form with react-hook-form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      billingEmail: '',
      phone: '',
      address: '',
      notes: '',
    },
  });
  
  // Update form values when client data is loaded
  useEffect(() => {
    if (client) {
      form.reset({
        companyName: client.companyName,
        contactPerson: client.contactPerson || '',
        billingEmail: client.billingEmail,
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
      });
      
      // Filter out billing email from additional emails
      setAdditionalEmails(
        client.emails.filter(email => email !== client.billingEmail)
      );
    }
  }, [client, form]);
  
  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientInput) => 
      apiRequest('POST', '/api/clients', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      navigate('/clients');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create client: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (data: { id: number, client: CreateClientInput }) => 
      apiRequest('PUT', `/api/clients/${data.id}`, data.client),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      navigate('/clients');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update client: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: ClientFormValues) => {
    // Combine billing email and additional emails
    const emails = [values.billingEmail, ...additionalEmails];
    
    const clientData: CreateClientInput = {
      ...values,
      emails,
    };
    
    if (isEditMode && client) {
      updateClientMutation.mutate({ id: client.id, client: clientData });
    } else {
      createClientMutation.mutate(clientData);
    }
  };
  
  // Handle adding a new email
  const handleAddEmail = () => {
    if (newEmail && isValidEmail(newEmail)) {
      setAdditionalEmails(prev => [...prev, newEmail]);
      setNewEmail('');
    } else if (newEmail) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle removing an email
  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails(prev => prev.filter(e => e !== email));
  };
  
  // Handle pressing Enter in the email input
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };
  
  // Button to go back to clients list
  const actions = (
    <Button 
      variant="ghost" 
      onClick={() => navigate('/clients')}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Clients
    </Button>
  );
  
  if (clientLoading) {
    return (
      <Layout title="Loading Client..." actions={actions}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title={isEditMode ? 'Edit Client' : 'Add New Client'} 
      actions={actions}
    >
      <Card className="bg-background-paper shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter company name" 
                            className="bg-background"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter contact person's name" 
                            className="bg-background"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter billing email" 
                            className="bg-background"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="Enter phone number" 
                            className="bg-background"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <FormLabel>Additional Emails</FormLabel>
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-background border border-input rounded-md">
                      {additionalEmails.map(email => (
                        <Badge 
                          key={email} 
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                        >
                          <span className="text-sm">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRemoveEmail(email)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      <div className="flex items-center flex-1 min-w-[150px]">
                        <Input 
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyDown={handleEmailKeyDown}
                          placeholder="Type and press Enter"
                          className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={handleAddEmail}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter company address" 
                            className="bg-background resize-none h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes" 
                            className="bg-background resize-none h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clients')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createClientMutation.isPending || updateClientMutation.isPending}
                >
                  {(createClientMutation.isPending || updateClientMutation.isPending) && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Update Client' : 'Save Client'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ClientForm;
