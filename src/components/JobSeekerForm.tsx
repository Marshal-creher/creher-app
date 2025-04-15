
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { FileText } from 'lucide-react';
import PersonalInfoSection from './JobSeeker/PersonalInfoSection';
import ProfessionalInfoSection from './JobSeeker/ProfessionalInfoSection';
import DocumentsSection from './JobSeeker/DocumentsSection';
import PreferencesSection from './JobSeeker/PreferencesSection';

const JobSeekerForm: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [location, setLocation] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [openToRemote, setOpenToRemote] = useState(true);
  const [openToRelocation, setOpenToRelocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const encode = (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return formData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!firstName || !lastName || !email || !jobCategory || !experienceLevel || !location || !coverLetter) {
      toast({
        title: t('error'),
        description: t('required_field'),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formData = {
      'form-name': 'job-seeker',
      firstName,
      lastName,
      email,
      phone,
      jobCategory,
      experienceLevel,
      location,
      resumeFile,
      coverLetter,
      openToRemote,
      openToRelocation
    };

    try {
      await fetch('/', {
        method: 'POST',
        body: encode(formData)
      });
      
      toast({
        title: t('profile_submitted'),
        description: t('profile_success'),
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setJobCategory('');
      setExperienceLevel('');
      setLocation('');
      setResumeFile(null);
      setCoverLetter('');
      setOpenToRemote(true);
      setOpenToRelocation(false);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('submission_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">{t('create_profile')}</CardTitle>
        <CardDescription>
          {t('profile_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          name="job-seeker" 
          method="POST" 
          data-netlify="true" 
          encType="multipart/form-data"
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="job-seeker" />
          
          <PersonalInfoSection
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
          />

          <ProfessionalInfoSection
            jobCategory={jobCategory}
            setJobCategory={setJobCategory}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            location={location}
            setLocation={setLocation}
          />

          <DocumentsSection
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            coverLetter={coverLetter}
            setCoverLetter={setCoverLetter}
          />

          <PreferencesSection
            openToRemote={openToRemote}
            setOpenToRemote={setOpenToRemote}
            openToRelocation={openToRelocation}
            setOpenToRelocation={setOpenToRelocation}
          />

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker-dark text-white" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText size={18} />
                {t('create_profile_button')}
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobSeekerForm;
