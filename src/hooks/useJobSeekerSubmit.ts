
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { MAX_CV_BYTES, submitForm } from '@/lib/submitForm';

export const useJobSeekerSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, customFormData?: FormData) => {
    e.preventDefault();

    const formData = customFormData || new FormData(e.currentTarget);
    const cvFile = formData.get('cv');
    const hasCv = cvFile instanceof File && cvFile.size > 0;

    if (hasCv && cvFile.size > MAX_CV_BYTES) {
      toast({
        title: t('error'),
        description: t('cv_too_large'),
        variant: "destructive",
      });
      return { success: false, jobSeekerId: null };
    }

    setLoading(true);
    setUploadingFiles(hasCv);

    try {
      formData.set('lang', language);
      const result = await submitForm('candidate', formData);

      if (!result.ok) {
        console.error('Form submission error:', result.error);
        const description =
          result.error === 'cv_too_large' ? t('cv_too_large') :
          result.error === 'cv_invalid' ? t('cv_invalid') :
          t('submission_error');
        toast({
          title: t('error'),
          description,
          variant: "destructive",
        });
        return { success: false, jobSeekerId: null };
      }

      toast({
        title: t('profile_submitted'),
        description: t('profile_success'),
      });

      return { success: true, jobSeekerId: result.id };
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return { handleSubmit, loading, uploadingFiles };
};
