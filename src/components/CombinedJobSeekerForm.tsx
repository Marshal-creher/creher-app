
import React, { useState, useEffect, useRef } from 'react';
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

interface CombinedJobSeekerFormProps {
  onFormValidChange?: (isValid: boolean) => void;
  onCVUploadChange?: (hasCV: boolean) => void;
  requestReview?: boolean;
  onRequestReviewChange?: (value: boolean) => void;
}

const CombinedJobSeekerForm: React.FC<CombinedJobSeekerFormProps> = ({ 
  onFormValidChange, 
  onCVUploadChange,
  requestReview = false,
  onRequestReviewChange
}) => {
  const { t } = useLanguage();
  const { handleSubmit, loading, uploadingFiles } = useJobSeekerSubmit();
  const { handleRequestReview } = useCVReview();
  const reviewRequestRef = useRef(requestReview);
  
  // Update the ref when requestReview changes
  useEffect(() => {
    reviewRequestRef.current = requestReview;
    console.log("requestReview changed in form:", requestReview);
  }, [requestReview]);
  
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
    if (onFormValidChange) {
      onFormValidChange(valid);
    }
  }, [personalInfo, onFormValidChange]);
  
  useEffect(() => {
    if (onCVUploadChange) {
      onCVUploadChange(cvFile !== null);
    }
  }, [cvFile, onCVUploadChange]);
  
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
    
    // Reset review request if needed
    if (onRequestReviewChange) {
      onRequestReviewChange(false);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submission started");
    
    // Get the current value of requestReview from the ref
    const shouldRequestReview = reviewRequestRef.current;
    console.log("Should request CV review:", shouldRequestReview);
    
    // Create a FormData object from the form
    const formData = new FormData(e.currentTarget);
    
    // Add our state values to ensure they're included
    formData.set('prenom', personalInfo.firstName);
    formData.set('nom', personalInfo.lastName);
    formData.set('email', personalInfo.email);
    formData.set('telephone', personalInfo.phone);
    
    if (cvFile) {
      console.log("Adding CV file to formData", cvFile.name);
      formData.set('cv', cvFile);
    }
    
    // Submit the form and get the job seeker ID if successful
    const result = await handleSubmit(e, formData);
    
    if (result.success && result.jobSeekerId) {
      console.log("Form submission successful, jobSeekerId:", result.jobSeekerId);
      
      // If CV review is requested, handle that with the new job seeker ID
      if (shouldRequestReview) {
        console.log("Attempting to handle CV review request with ID:", result.jobSeekerId);
        const reviewResult = await handleRequestReview(result.jobSeekerId);
        console.log("CV review request result:", reviewResult);
      } else {
        console.log("CV review not requested, skipping request");
      }
      
      onSubmitSuccess();
    } else {
      console.error("Form submission failed or no job seeker ID returned");
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
          onSubmit={handleFormSubmit} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="contact" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-jobseeker">{t('personal_information')}</h3>
            <PersonalInfoSection 
              formData={personalInfo}
              onChange={handlePersonalInfoChange}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-jobseeker">{t('preferences')}</h3>
            <PreferencesSection 
              openToRemote={openToRemote}
              setOpenToRemote={setOpenToRemote}
              openToRelocation={openToRelocation}
              setOpenToRelocation={setOpenToRelocation}
            />
          </div>

          <JobSeekerDocumentsSection 
            onCVUpload={setCvFile}
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
