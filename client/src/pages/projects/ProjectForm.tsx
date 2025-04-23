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
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { dollarsToCents, centsToDollars, formatDateForInput } from '@/lib/utils';
import { Client, Project, CreateProjectInput, ProjectType, ProjectStatus } from '@/types';

// Schema for the project form
const projectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  clientId: z.string().min(1, {
    message: "Please select a client.",
  }),
  type: z.enum(['daily_rate', 'fixed_price']),
  rate: z.string().min(1, {
    message: "Please enter a rate.",
  }),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'completed']),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  projectId?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!projectId;
  
  // Fetch clients for the select dropdown
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients']
  });
  
  // Fetch project data if in edit mode
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: isEditMode,
  });
  
  // Set up form with react-hook-form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      clientId: '',
      type: 'daily_rate',
      rate: '',
      startDate: null,
      endDate: null,
      status: 'open',
      description: '',
    },
  });
  
  // Update form values when project data is loaded
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        clientId: project.clientId.toString(),
        type: project.type as ProjectType,
        rate: centsToDollars(project.rate).toString(),
        startDate: project.startDate ? formatDateForInput(project.startDate) : null,
        endDate: project.endDate ? formatDateForInput(project.endDate) : null,
        status: project.status as ProjectStatus,
        description: project.description || '',
      });
    }
  }, [project, form]);
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectInput) => 
      apiRequest('POST', '/api/projects', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      navigate('/projects');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: { id: number, project: CreateProjectInput }) => 
      apiRequest('PUT', `/api/projects/${data.id}`, data.project),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      navigate('/projects');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update project: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: ProjectFormValues) => {
    // Convert form values to the correct format for API
    const projectData: CreateProjectInput = {
      name: values.name,
      clientId: parseInt(values.clientId),
      type: values.type as ProjectType,
      rate: dollarsToCents(parseFloat(values.rate)), // Convert dollars to cents
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      status: values.status as ProjectStatus,
      description: values.description || undefined,
    };
    
    if (isEditMode && project) {
      updateProjectMutation.mutate({ id: project.id, project: projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };
  
  // Button to go back to projects list
  const actions = (
    <Button 
      variant="ghost" 
      onClick={() => navigate('/projects')}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Projects
    </Button>
  );
  
  const isLoading = clientsLoading || (isEditMode && projectLoading);
  
  if (isLoading) {
    return (
      <Layout title="Loading..." actions={actions}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title={isEditMode ? 'Edit Project' : 'Add New Project'} 
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter project name" 
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
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.length === 0 ? (
                              <SelectItem value="" disabled>
                                No clients available
                              </SelectItem>
                            ) : (
                              clients.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.companyName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Project Type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="daily_rate" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Daily Rate
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="fixed_price" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Fixed Price
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch('type') === 'daily_rate' ? 'Day Rate (USD) *' : 'Fixed Price (USD) *'}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-muted-foreground">$</span>
                            </div>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00" 
                              className="pl-7 bg-background"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="bg-background"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="bg-background"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter project description" 
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
                  onClick={() => navigate('/projects')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                >
                  {(createProjectMutation.isPending || updateProjectMutation.isPending) && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Update Project' : 'Save Project'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ProjectForm;
