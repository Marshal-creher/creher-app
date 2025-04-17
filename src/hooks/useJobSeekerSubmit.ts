
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
      const coverLetterFile = formData.get('lettre') as File;
      
      console.log("Form data collected:", { firstName, lastName, email, phone });
      console.log("CV file:", cvFile instanceof File ? cvFile.name : "No CV file");
      console.log("Cover letter file:", coverLetterFile instanceof File ? coverLetterFile.name : "No cover letter file");
      
      let cvUrl = null;
      let coverLetterUrl = null;
      
      try {
        // Create storage bucket if it doesn't exist
        console.log("Checking if storage bucket exists");
        const { data: bucketList, error: bucketListError } = await supabase.storage.listBuckets();
        
        if (bucketListError) {
          console.error("Error listing buckets:", bucketListError);
        }
        
        const bucketExists = bucketList?.some(bucket => bucket.name === 'job_seeker_documents');
        console.log("Bucket exists:", bucketExists);
        
        if (!bucketExists) {
          console.log("Creating storage bucket");
          const { data: newBucket, error: createBucketError } = await supabase.storage.createBucket('job_seeker_documents', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (createBucketError) {
            console.error("Error creating bucket:", createBucketError);
          } else {
            console.log("Bucket created successfully:", newBucket);
          }
        }
      } catch (bucketError) {
        console.error("Error checking/creating bucket:", bucketError);
        // Continue execution - the bucket might already exist
      }
      
      if (cvFile && cvFile instanceof File && cvFile.size > 0) {
        console.log("Uploading CV file:", cvFile.name, cvFile.size, "bytes");
        setUploadingFiles(true);
        const cvFileName = `${Date.now()}_${cvFile.name.replace(/\s+/g, '_')}`;
        
        try {
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
          
          console.log("CV uploaded successfully:", cvData);
          
          const { data: { publicUrl: cvPublicUrl } } = supabase.storage
            .from('job_seeker_documents')
            .getPublicUrl(cvFileName);
            
          cvUrl = cvPublicUrl;
          console.log("CV public URL:", cvUrl);
        } catch (uploadError) {
          console.error("CV upload exception:", uploadError);
          toast({
            title: t('error'),
            description: t('cv_upload_error'),
            variant: "destructive",
          });
        }
      }
      
      if (coverLetterFile && coverLetterFile instanceof File && coverLetterFile.size > 0) {
        console.log("Uploading cover letter file:", coverLetterFile.name, coverLetterFile.size, "bytes");
        const coverLetterFileName = `${Date.now()}_${coverLetterFile.name.replace(/\s+/g, '_')}`;
        
        try {
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
          
          console.log("Cover letter uploaded successfully:", coverData);
          
          const { data: { publicUrl: coverPublicUrl } } = supabase.storage
            .from('job_seeker_documents')
            .getPublicUrl(coverLetterFileName);
            
          coverLetterUrl = coverPublicUrl;
          console.log("Cover letter public URL:", coverLetterUrl);
        } catch (uploadError) {
          console.error("Cover letter upload exception:", uploadError);
          // Continue execution even if cover letter upload fails
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
          cv_url: cvUrl,
          cover_letter_url: coverLetterUrl
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
        const netlifyFormData = new FormData(e.currentTarget);
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
