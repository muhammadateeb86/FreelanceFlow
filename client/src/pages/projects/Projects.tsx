import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Trash2, Edit, RefreshCw, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency } from '@/lib/utils';
import { Client, Project, ProjectWithClient } from '@/types';

const Projects = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading, refetch } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: true
  });
  
  // Fetch clients for mapping client names
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    refetchOnWindowFocus: true
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/projects/${id}`),
    onSuccess: () => {
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete project: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Create project with client data for display
  const projectsWithClients: ProjectWithClient[] = projects.map(project => {
    const client = clients.find(c => c.id === project.clientId);
    return { ...project, client };
  });
  
  // Filter projects based on search and status
  const filteredProjects = projectsWithClients.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.client?.companyName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Actions component with Add Project button
  const actions = (
    <Button 
      onClick={() => navigate('/projects/new')}
      className="flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add New Project
    </Button>
  );
  
  return (
    <Layout title="Projects" actions={actions}>
      <Card className="bg-background-paper shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
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
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsLoading || clientsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <RefreshCw className="h-5 w-5 mx-auto animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No projects found.
                      {search && ' Try a different search term.'}
                      {!search && ' Add a new project to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map(project => (
                    <TableRow key={project.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-white">
                        {project.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.client?.companyName || `Client #${project.clientId}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.type === 'daily_rate' ? 'Daily Rate' : 'Fixed Price'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.type === 'daily_rate' 
                          ? `${formatCurrency(project.rate)}/day` 
                          : formatCurrency(project.rate)}
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                            className="h-8 w-8 text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setProjectToDelete(project)}
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
          
          {filteredProjects.length > 0 && (
            <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredProjects.length}</span> of{' '}
                <span className="font-medium">{projects.length}</span> projects
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!projectToDelete} 
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the project "{projectToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? (
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

export default Projects;
