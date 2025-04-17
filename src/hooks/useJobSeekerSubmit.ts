
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { supabase } from "@/integrations/supabase/client";

export const useJobSeekerSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, customFormData?: FormData) => {
    e.preventDefault();
    setLoading(true);
    console.log("Starting job seeker submission process");

    try {
      const formData = customFormData || new FormData(e.currentTarget);
      const firstName = formData.get('prenom') as string;
      const lastName = formData.get('nom') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('telephone') as string;
      const cvFile = formData.get('cv') as File;
      
      console.log("Form data collected:", { firstName, lastName, email, phone });
      console.log("CV file:", cvFile instanceof File ? cvFile.name : "No CV file");
      
      let cvUrl = null;
      
      if (cvFile && cvFile instanceof File && cvFile.size > 0) {
        console.log("Uploading CV file:", cvFile.name, cvFile.size, "bytes");
        setUploadingFiles(true);
        const cvFileName = `${Date.now()}_${cvFile.name.replace(/\s+/g, '_')}`;
        
        try {
          // Get file extension and set content type
          const fileExt = cvFile.name.split('.').pop()?.toLowerCase() || '';
          const contentType = fileExt === 'pdf' ? 'application/pdf' : 
                              fileExt === 'doc' ? 'application/msword' :
                              fileExt === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                              'application/octet-stream';
          
          console.log(`File extension: ${fileExt}, Content-Type: ${contentType}`);
          
          // First, check if the bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === 'job_seeker_documents');
          
          // If bucket doesn't exist, we'll inform the user but continue with database save
          if (!bucketExists) {
            console.log("Warning: job_seeker_documents bucket does not exist");
            
            // Skip bucket creation attempt since it causes RLS error
            // We'll save the job seeker data without a CV
          } else {
            // Bucket exists, proceed with upload
            const { data: cvData, error: cvError } = await supabase.storage
              .from('job_seeker_documents')
              .upload(cvFileName, cvFile, {
                cacheControl: '3600',
                upsert: true
              });
              
            if (cvError) {
              console.error("CV upload error:", cvError);
              
              // Still continue with form submission even if CV upload fails
              toast({
                title: t('warning'),
                description: t('cv_upload_error'),
                variant: "destructive",
              });
            } else {
              console.log("CV uploaded successfully:", cvData);
              
              const { data: { publicUrl: cvPublicUrl } } = supabase.storage
                .from('job_seeker_documents')
                .getPublicUrl(cvFileName);
                
              cvUrl = cvPublicUrl;
              console.log("CV public URL:", cvUrl);
            }
          }
        } catch (uploadError) {
          console.error("CV upload exception:", uploadError);
          toast({
            title: t('warning'),
            description: t('cv_upload_error'),
            variant: "destructive",
          });
          // Continue with form submission without the CV
        }
      }
      
      setUploadingFiles(false);
      
      // Save data to Supabase
      console.log("Saving job seeker data to Supabase");
      const { data, error } = await supabase
        .from('job_seekers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          cv_url: cvUrl
        })
        .select();

      if (error) {
        console.error("Database insertion error:", error);
        throw error;
      }
      
      console.log("Job seeker data saved successfully:", data);
      
      // Get the newly created job seeker ID
      const jobSeekerId = data && data[0] ? data[0].id : null;
      console.log("New job seeker ID:", jobSeekerId);
      
      // Try to submit to Netlify forms as a backup
      try {
        console.log("Submitting to Netlify forms as backup");
        const netlifyFormData = new FormData();
        netlifyFormData.append('form-name', 'contact');
        netlifyFormData.append('prenom', firstName);
        netlifyFormData.append('nom', lastName);
        netlifyFormData.append('email', email);
        netlifyFormData.append('telephone', phone || '');
        
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(netlifyFormData as any).toString()
        });
        console.log("Netlify form submission successful");
      } catch (netlifyError) {
        console.warn("Netlify form submission failed, but Supabase succeeded:", netlifyError);
        // Continue since we already saved to Supabase
      }
      
      toast({
        title: t('profile_submitted'),
        description: t('profile_success'),
      });
      
      return { success: true, jobSeekerId };
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t('error'),
        description: t('submission_error'),
        variant: "destructive",
      });
      return { success: false, jobSeekerId: null };
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return { handleSubmit, loading, uploadingFiles };
};
