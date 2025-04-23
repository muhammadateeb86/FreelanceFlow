import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate, dollarsToCents } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Client, Project, Workday, CreateWorkdayInput, CreateInvoiceInput } from '@/types';

interface ProjectDetailProps {
  projectId: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  
  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${project?.clientId}`],
    enabled: !!project,
  });
  
  // Fetch workdays for this project
  const { data: workdays = [], isLoading: workdaysLoading } = useQuery<Workday[]>({
    queryKey: [`/api/projects/${projectId}/workdays`],
    enabled: !!projectId,
  });
  
  // Set up workday mutation
  const toggleWorkdayMutation = useMutation({
    mutationFn: (date: Date) => {
      // Check if the date is already selected
      const existingWorkday = workdays.find(
        w => new Date(w.date).toDateString() === date.toDateString()
      );
      
      if (existingWorkday) {
        // Delete workday
        return apiRequest('DELETE', `/api/workdays/${existingWorkday.id}`);
      } else {
        // Create new workday
        const workdayData: CreateWorkdayInput = {
          projectId: parseInt(projectId),
          date: date.toISOString().split('T')[0],
        };
        return apiRequest('POST', '/api/workdays', workdayData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/workdays`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update workday: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update project status mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: (status: string) => 
      apiRequest('PUT', `/api/projects/${projectId}`, { status }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update project status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => 
      apiRequest('POST', '/api/invoices', data),
    onSuccess: (response: any) => {
      // Make sure we have a valid invoice ID before navigating
      if (response && response.id) {
        toast({
          title: 'Success',
          description: 'Invoice generated successfully',
        });
        // Ensure we get the created invoice
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        // Navigate with a small delay to ensure the invoice is accessible
        setTimeout(() => {
          navigate(`/invoices/${response.id}`);
        }, 500);
      } else {
        toast({
          title: 'Success',
          description: 'Invoice generated successfully. Please check the Invoices page.',
          variant: 'default',
        });
        // Fallback to invoices list if we don't have an ID
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        navigate('/invoices');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate invoice: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Initialize selected days from workdays when data is loaded
  useEffect(() => {
    if (workdays.length > 0) {
      const selectedDates = workdays.map(w => new Date(w.date));
      setSelectedDays(selectedDates);
    }
  }, [workdays]);
  
  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    const daysArray: CalendarDay[] = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -firstDayOfWeek + i + 1);
      daysArray.push({
        date: prevMonthDay,
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        isSelected: selectedDays.some(d => d.toDateString() === prevMonthDay.toDateString()),
        isDisabled: true,
      });
    }
    
    // Add days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      daysArray.push({
        date,
        day,
        isCurrentMonth: true,
        isSelected: selectedDays.some(d => d.toDateString() === date.toDateString()),
        isDisabled: false,
      });
    }
    
    // Add empty cells for days after the last of the month to complete the grid
    const daysToAdd = 42 - daysArray.length; // 6 rows of 7 days
    for (let i = 1; i <= daysToAdd; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      daysArray.push({
        date: nextMonthDay,
        day: nextMonthDay.getDate(),
        isCurrentMonth: false,
        isSelected: selectedDays.some(d => d.toDateString() === nextMonthDay.toDateString()),
        isDisabled: true,
      });
    }
    
    setCalendarDays(daysArray);
  }, [currentDate, selectedDays]);
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prev.getMonth() - 1);
      return prevMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + 1);
      return nextMonth;
    });
  };
  
  // Handle day selection
  const handleDayClick = (day: CalendarDay) => {
    if (day.isDisabled) return;
    
    // Clone the date and set time to midnight to avoid timezone issues
    const fixedDate = new Date(Date.UTC(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate(),
      0, 0, 0, 0
    ));
    
    // Toggle the workday in the database
    toggleWorkdayMutation.mutate(fixedDate);
  };
  
  // Handle project status change
  const handleStatusChange = (status: string) => {
    updateProjectStatusMutation.mutate(status);
  };
  
  // Calculate total amount based on selected days and project rate
  const calculateTotal = (): number => {
    if (!project) return 0;
    
    // For daily rate projects, multiply rate by number of selected days
    if (project.type === 'daily_rate') {
      return project.rate * selectedDays.length;
    }
    
    // For fixed price projects, just return the rate
    return project.rate;
  };
  
  // Format the current month and year
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Generate invoice
  const handleGenerateInvoice = () => {
    if (!project || !client) return;
    
    // For daily rate projects, ensure there are selected days
    if (project.type === 'daily_rate' && selectedDays.length === 0) {
      toast({
        title: 'No workdays selected',
        description: 'Please select at least one workday to generate an invoice',
        variant: 'destructive',
      });
      return;
    }
    
    // Calculate invoice due date (14 days from today)
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Prepare invoice data
    const invoiceData: CreateInvoiceInput = {
      projectId: project.id,
      clientId: client.id,
      amount: calculateTotal(),
      invoiceDate: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      workdaysIds: workdays
        .filter(w => selectedDays.some(d => d.toDateString() === new Date(w.date).toDateString()))
        .map(w => w.id),
      notes: `Invoice for ${project.name}`,
    };
    
    generateInvoiceMutation.mutate(invoiceData);
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
  
  const isLoading = projectLoading || clientLoading || workdaysLoading;
  
  if (isLoading) {
    return (
      <Layout title="Loading Project..." actions={actions}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!project || !client) {
    return (
      <Layout title="Project Not Found" actions={actions}>
        <Card className="bg-background-paper shadow-lg">
          <CardContent className="p-6 text-center">
            <p>The requested project could not be found.</p>
            <Button 
              onClick={() => navigate('/projects')} 
              className="mt-4"
            >
              Return to Projects
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }
  
  return (
    <Layout actions={actions}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Client: {client.companyName}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <ProjectStatusBadge status={project.status} />
          <Badge className="bg-primary-dark text-white">
            {project.type === 'daily_rate' 
              ? `Daily Rate: ${formatCurrency(project.rate)}` 
              : `Fixed Price: ${formatCurrency(project.rate)}`}
          </Badge>
        </div>
      </div>
      
      {/* Project Details */}
      <Card className="bg-background-paper shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-lg font-medium text-white">Project Details</h2>
          <div className="mt-2 md:mt-0">
            <Button 
              onClick={() => navigate(`/projects/${projectId}/edit`)}
              className="mr-2"
              variant="outline"
            >
              Edit Project
            </Button>
            <Button 
              onClick={handleGenerateInvoice}
              disabled={generateInvoiceMutation.isPending}
            >
              {generateInvoiceMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : 'Generate Invoice'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Start Date
              </label>
              <div className="text-white">
                {project.startDate ? formatDate(project.startDate) : 'Not specified'}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                End Date
              </label>
              <div className="text-white">
                {project.endDate ? formatDate(project.endDate) : 'Not specified'}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Project Type
              </label>
              <div className="text-white">
                {project.type === 'daily_rate' ? 'Daily Rate' : 'Fixed Price'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Description
              </label>
              <div className="text-white">
                {project.description || 'No description provided'}
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Contact Person
              </label>
              <div className="text-white">
                {client.contactPerson || 'Not specified'}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Contact Email
              </label>
              <div className="text-white">
                {client.emails[0] || client.billingEmail}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Billing Email
              </label>
              <div className="text-white">
                {client.billingEmail}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Status
              </label>
              <div>
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Workday Calendar - Only show for daily rate projects */}
      {project.type === 'daily_rate' && (
        <Card className="bg-background-paper shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-medium text-white">Workday Tracking</h2>
            <div className="flex items-center mt-2 md:mt-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="mx-4 text-white font-medium">
                {formatMonthYear(currentDate)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Calendar */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-1 mb-2">
              <div className="text-center text-sm text-muted-foreground py-1">Sun</div>
              <div className="text-center text-sm text-muted-foreground py-1">Mon</div>
              <div className="text-center text-sm text-muted-foreground py-1">Tue</div>
              <div className="text-center text-sm text-muted-foreground py-1">Wed</div>
              <div className="text-center text-sm text-muted-foreground py-1">Thu</div>
              <div className="text-center text-sm text-muted-foreground py-1">Fri</div>
              <div className="text-center text-sm text-muted-foreground py-1">Sat</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`h-12 flex items-center justify-center calendar-day rounded-md border ${
                    day.isDisabled 
                      ? 'calendar-day-disabled' 
                      : 'border-border hover:cursor-pointer'
                  } ${
                    day.isSelected ? 'calendar-day-selected' : ''
                  } ${
                    !day.isCurrentMonth ? 'text-muted-foreground' : ''
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <span>{day.day}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">
                  Selected Workdays: <span>{selectedDays.length}</span>
                </h3>
                <p className="text-muted-foreground text-sm">
                  {selectedDays.length > 0 
                    ? selectedDays
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map(date => formatDate(date))
                        .join(', ')
                    : 'No workdays selected'}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center bg-background rounded-md p-3 text-white font-medium">
                  Total: <span className="ml-1 text-primary text-lg">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleGenerateInvoice}
              disabled={generateInvoiceMutation.isPending || selectedDays.length === 0}
              className="flex items-center"
            >
              {generateInvoiceMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate Invoice
            </Button>
          </div>
        </Card>
      )}
      
      {/* For fixed price projects, show simple invoice generation section */}
      {project.type === 'fixed_price' && (
        <Card className="bg-background-paper shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Fixed Price Project</h2>
              <p className="text-muted-foreground">
                Generate an invoice for the full amount of {formatCurrency(project.rate)}.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={handleGenerateInvoice}
                disabled={generateInvoiceMutation.isPending}
                className="flex items-center"
              >
                {generateInvoiceMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate Invoice
              </Button>
            </div>
          </div>
        </Card>
      )}
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

export default ProjectDetail;
