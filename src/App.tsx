
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./hooks/useLanguageContext";

import Index from "./pages/Index";
import JobSeeker from "./pages/JobSeeker";
import Recruiter from "./pages/Recruiter";
import NotFound from "./pages/NotFound";

// INFINITAS HRM — all /crm/* routes
import { CrmApp } from "./crm/CrmApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* CREHER public site */}
            <Route path="/" element={<Index />} />
            <Route path="/job-seeker" element={<JobSeeker />} />
            <Route path="/recruiter" element={<Recruiter />} />

            {/* INFINITAS HRM — all /crm/* handled internally by CrmApp */}
            <Route path="/crm/*" element={<CrmApp />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
