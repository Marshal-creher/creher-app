
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { supabase } from "@/integrations/supabase/client";

export const useCVReview = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestReview, setRequestReview] = useState(false);
  const [hasUsedFreeReview, setHasUsedFreeReview] = useState(false);

  useEffect(() => {
    const checkFreeReviewStatus = async () => {
      try {
        const { data: latestJobSeeker, error: jobSeekerError } = await supabase
          .from('job_seekers')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (jobSeekerError) {
          console.error("Error fetching job seeker:", jobSeekerError);
          return;
        }
        
        if (!latestJobSeeker || latestJobSeeker.length === 0) return;
        
        const jobSeekerId = latestJobSeeker[0].id;
        
        const { data: existingReviews, error: reviewError } = await supabase
          .from('cv_review_requests')
          .select('id, is_free_review')
          .eq('job_seeker_id', jobSeekerId);
        
        if (reviewError) {
          console.error("Error checking reviews:", reviewError);
          return;
        }
        
        // Check if any previous reviews exist, especially free reviews
        const hasFreeReview = existingReviews?.some(review => review.is_free_review);
        setHasUsedFreeReview(hasFreeReview || false);
      } catch (error) {
        console.error('Error checking free review status:', error);
      }
    };

    checkFreeReviewStatus();
  }, []);

  const handleRequestReview = async () => {
    if (!requestReview) return;
    
    setLoading(true);
    try {
      // Get the most recent job seeker entry
      const { data: latestJobSeeker, error: jobSeekerError } = await supabase
        .from('job_seekers')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (jobSeekerError) {
        console.error("Error fetching job seeker:", jobSeekerError);
        throw jobSeekerError;
      }
      
      if (!latestJobSeeker || latestJobSeeker.length === 0) {
        toast({
          title: t('error'),
          description: t('no_job_seeker_profile'),
          variant: "destructive",
        });
        return;
      }
      
      const jobSeekerId = latestJobSeeker[0].id;
      
      // Insert CV review request
      const { error: insertError } = await supabase
        .from('cv_review_requests')
        .insert({
          job_seeker_id: jobSeekerId,
          status: 'pending',
          is_free_review: !hasUsedFreeReview
        });
        
      if (insertError) {
        console.error("Error inserting CV review request:", insertError);
        throw insertError;
      }
      
      toast({
        title: t('cv_review_requested'),
        description: t('cv_review_confirmation'),
      });
      
      // Reset form after successful submission
      setRequestReview(false);
      setHasUsedFreeReview(true);
    } catch (error) {
      console.error('CV review request error:', error);
      toast({
        title: t('error'),
        description: t('cv_review_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    requestReview,
    setRequestReview,
    hasUsedFreeReview,
    handleRequestReview
  };
};
