
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import CombinedJobSeekerForm from '@/components/CombinedJobSeekerForm';
import { UserRound, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import FreeResumeHelp from '@/components/FreeResumeHelp';
import CalendarBooking from '@/components/CalendarBooking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JobSeeker: React.FC = () => {
  const { t } = useLanguage();
  const [formCompleted, setFormCompleted] = useState(false);
  
  const handleFormSubmit = () => {
    setFormCompleted(true);
  };
  
  return (
    <Layout>
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-jobseeker/10 rounded-full mb-4">
              <UserRound className="h-10 w-10 text-jobseeker" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{t('registration_and_application')}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('create_account_and_apply')}
            </p>
          </div>
          
          <Tabs defaultValue="application" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="application" className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {t('application')}
              </TabsTrigger>
              <TabsTrigger value="cv-help" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('free_cv_help') || "Free CV Help"}
              </TabsTrigger>
              <TabsTrigger value="booking" className="flex items-center gap-2" disabled={!formCompleted}>
                <Calendar className="h-4 w-4" />
                {t('book_session') || "Book a Session"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="application" className="max-w-3xl mx-auto">
              <CombinedJobSeekerForm onSubmitSuccess={handleFormSubmit} />
            </TabsContent>
            
            <TabsContent value="cv-help">
              <FreeResumeHelp />
            </TabsContent>
            
            <TabsContent value="booking">
              {formCompleted ? (
                <CalendarBooking />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <p className="text-amber-800 mb-4">{t('complete_form_first') || "Please complete the application form first"}</p>
                  <button 
                    className="text-jobseeker underline"
                    onClick={() => document.querySelector('[data-value="application"]')?.click()}
                  >
                    {t('go_to_form') || "Go to the application form"}
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default JobSeeker;
