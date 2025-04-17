
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { supabase } from "@/integrations/supabase/client";

export const useJobSeekerSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get('prenom') as string;
      const lastName = formData.get('nom') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('telephone') as string;
      const cvFile = formData.get('cv') as File;
      const coverLetterFile = formData.get('lettre') as File;
      
      let cvUrl = null;
      let coverLetterUrl = null;
      
      // Create the storage bucket if it doesn't exist
      await supabase.storage.createBucket('job_seeker_documents', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (cvFile && cvFile instanceof File && cvFile.size > 0) {
        setUploadingFiles(true);
        const cvFileName = `${Date.now()}_${cvFile.name}`;
        const { data: cvData, error: cvError } = await supabase.storage
          .from('job_seeker_documents')
          .upload(cvFileName, cvFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (cvError) {
          console.error("CV upload error:", cvError);
          throw new Error(`CV upload error: ${cvError.message}`);
        }
        
        const { data: { publicUrl: cvPublicUrl } } = supabase.storage
          .from('job_seeker_documents')
          .getPublicUrl(cvFileName);
          
        cvUrl = cvPublicUrl;
      }
      
      if (coverLetterFile && coverLetterFile instanceof File && coverLetterFile.size > 0) {
        const coverLetterFileName = `${Date.now()}_${coverLetterFile.name}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('job_seeker_documents')
          .upload(coverLetterFileName, coverLetterFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (coverError) {
          console.error("Cover letter upload error:", coverError);
          throw new Error(`Cover letter upload error: ${coverError.message}`);
        }
        
        const { data: { publicUrl: coverPublicUrl } } = supabase.storage
          .from('job_seeker_documents')
          .getPublicUrl(coverLetterFileName);
          
        coverLetterUrl = coverPublicUrl;
      }
      
      setUploadingFiles(false);
      
      const { data, error } = await supabase
        .from('job_seekers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          cv_url: cvUrl,
          cover_letter_url: coverLetterUrl
        })
        .select();

      if (error) {
        console.error("Database insertion error:", error);
        throw error;
      }
      
      // Try to submit to Netlify forms as a backup
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData as any).toString()
        });
      } catch (netlifyError) {
        console.warn("Netlify form submission failed, but Supabase succeeded:", netlifyError);
        // Continue since we already saved to Supabase
      }
      
      toast({
        title: t('profile_submitted'),
        description: t('profile_success'),
      });
      
      return true; // Successful submission
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t('error'),
        description: t('submission_error'),
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return { handleSubmit, loading, uploadingFiles };
};
