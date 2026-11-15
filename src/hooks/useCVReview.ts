
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';

// The CV review request travels with the application itself (the `cv_review`
// field sent by CombinedJobSeekerForm), so this hook only tracks the checkbox
// and confirms the request once the application has been accepted.
export const useCVReview = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [requestReview, setRequestReview] = useState(false);

  const handleRequestReview = async (jobSeekerId?: string) => {
    if (!jobSeekerId) {
      toast({
        title: t('error'),
        description: t('no_job_seeker_profile'),
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: t('cv_review_requested'),
      description: t('cv_review_confirmation'),
    });

    setRequestReview(false);
    return true;
  };

  return {
    loading: false,
    requestReview,
    setRequestReview,
    hasUsedFreeReview: false,
    handleRequestReview
  };
};
