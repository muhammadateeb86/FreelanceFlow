import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";
import Clients from "@/pages/clients/Clients";
import ClientForm from "@/pages/clients/ClientForm";
import Projects from "@/pages/projects/Projects";
import ProjectForm from "@/pages/projects/ProjectForm";
import ProjectDetail from "@/pages/projects/ProjectDetail";
import Invoices from "@/pages/invoices/Invoices";
import InvoicePreview from "@/pages/invoices/InvoicePreview";

function Router() {
  return (
    <Switch>
      {/* Dashboard */}
      <Route path="/" component={Dashboard} />
      
      {/* Clients */}
      <Route path="/clients" component={Clients} />
      <Route path="/clients/new" component={ClientForm} />
      <Route path="/clients/:id/edit">
        {params => <ClientForm clientId={params.id} />}
      </Route>
      
      {/* Projects */}
      <Route path="/projects" component={Projects} />
      <Route path="/projects/new" component={ProjectForm} />
      <Route path="/projects/:id">
        {params => <ProjectDetail projectId={params.id} />}
      </Route>
      <Route path="/projects/:id/edit">
        {params => <ProjectForm projectId={params.id} />}
      </Route>
      
      {/* Invoices */}
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/:id">
        {params => <InvoicePreview invoiceId={params.id} />}
      </Route>
      
      {/* Settings - would be added in a future enhancement */}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
