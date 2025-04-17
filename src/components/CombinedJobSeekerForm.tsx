
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/hooks/useLanguageContext';
import { useJobSeekerSubmit } from '@/hooks/useJobSeekerSubmit';
import { useCVReview } from '@/hooks/useCVReview';

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
  const { handleRequestReview } = useCVReview();
  
  // Preferences state
  const [openToRemote, setOpenToRemote] = useState(false);
  const [openToRelocation, setOpenToRelocation] = useState(false);
  
  // Personal info state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Document state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  
  // Form validation
  const [isFormValid, setIsFormValid] = useState(false);
  
  useEffect(() => {
    // Check if required fields are filled
    const valid = 
      personalInfo.firstName.trim() !== '' && 
      personalInfo.lastName.trim() !== '' && 
      personalInfo.email.trim() !== '' && 
      personalInfo.phone.trim() !== '';
    
    setIsFormValid(valid);
  }, [personalInfo]);
  
  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const onSubmitSuccess = () => {
    // Reset form state
    setOpenToRemote(false);
    setOpenToRelocation(false);
    setPersonalInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    setCvFile(null);
    setCoverLetterFile(null);
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, withReview = false) => {
    e.preventDefault();
    
    // Create a FormData object from the form
    const formData = new FormData(e.currentTarget);
    
    // Add our state values to ensure they're included
    formData.set('prenom', personalInfo.firstName);
    formData.set('nom', personalInfo.lastName);
    formData.set('email', personalInfo.email);
    formData.set('telephone', personalInfo.phone);
    
    if (cvFile) {
      formData.set('cv', cvFile);
    }
    
    if (coverLetterFile) {
      formData.set('lettre', coverLetterFile);
    }
    
    // Submit the form and get the job seeker ID if successful
    const result = await handleSubmit(e, formData);
    
    if (result.success) {
      // If we're also submitting a CV review request, do that with the new job seeker ID
      if (withReview && result.jobSeekerId) {
        await handleRequestReview(result.jobSeekerId);
      }
      
      onSubmitSuccess();
    }
  };
  
  // Function to handle both form submission and CV review request
  const handleSubmitBoth = () => {
    const formElement = document.querySelector('form[name="contact"]') as HTMLFormElement;
    if (formElement) {
      handleFormSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>, true);
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
          onSubmit={(e) => handleFormSubmit(e)} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="contact" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('personal_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonalInfoSection 
                formData={personalInfo}
                onChange={handlePersonalInfoChange}
              />
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

          <JobSeekerDocumentsSection 
            onCVUpload={setCvFile}
            onCoverLetterUpload={setCoverLetterFile}
          />

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
