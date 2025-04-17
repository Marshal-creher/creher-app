
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/hooks/useLanguageContext';
import { useJobSeekerSubmit } from '@/hooks/useJobSeekerSubmit';

// Import all the smaller components
import NetlifyFormSetup from './JobSeeker/NetlifyFormSetup';
import JobSeekerFormHeader from './JobSeeker/JobSeekerFormHeader';
import PersonalInfoSection from './JobSeeker/PersonalInfoSection';
import PreferencesSection from './JobSeeker/PreferencesSection';
import JobSeekerDocumentsSection from './JobSeeker/JobSeekerDocumentsSection';
import SubmitButton from './JobSeeker/SubmitButton';

const CombinedJobSeekerForm: React.FC = () => {
  const { t } = useLanguage();
  const { handleSubmit, loading, uploadingFiles } = useJobSeekerSubmit();
  
  // Preferences state
  const [openToRemote, setOpenToRemote] = useState(false);
  const [openToRelocation, setOpenToRelocation] = useState(false);
  
  const onSubmitSuccess = () => {
    // Reset form state
    setOpenToRemote(false);
    setOpenToRelocation(false);
  };
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const success = await handleSubmit(e);
    if (success) {
      onSubmitSuccess();
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <Card className="w-full">
      <NetlifyFormSetup />
      <JobSeekerFormHeader />
      <CardContent>
        <form 
          name="contact" 
          method="POST" 
          data-netlify="true" 
          encType="multipart/form-data"
          onSubmit={onSubmit} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="contact" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('personal_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonalInfoSection />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('preferences')}</h3>
            <PreferencesSection 
              openToRemote={openToRemote}
              setOpenToRemote={setOpenToRemote}
              openToRelocation={openToRelocation}
              setOpenToRelocation={setOpenToRelocation}
            />
          </div>

          <JobSeekerDocumentsSection />

          <SubmitButton 
            loading={loading} 
            uploadingFiles={uploadingFiles} 
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default CombinedJobSeekerForm;
