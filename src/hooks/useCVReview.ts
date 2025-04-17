
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
        
        if (!latestJobSeeker || latestJobSeeker.length === 0) {
          console.log("No job seekers found");
          return;
        }
        
        const jobSeekerId = latestJobSeeker[0].id;
        console.log("Latest job seeker ID:", jobSeekerId);
        
        const { data: existingReviews, error: reviewError } = await supabase
          .from('cv_review_requests')
          .select('id, is_free_review')
          .eq('job_seeker_id', jobSeekerId);
        
        if (reviewError) {
          console.error("Error checking reviews:", reviewError);
          return;
        }
        
        console.log("Existing reviews:", existingReviews);
        
        // Check if any previous reviews exist, especially free reviews
        const hasFreeReview = existingReviews?.some(review => review.is_free_review);
        setHasUsedFreeReview(hasFreeReview || false);
        console.log("Has used free review:", hasFreeReview);
      } catch (error) {
        console.error('Error checking free review status:', error);
      }
    };

    checkFreeReviewStatus();
  }, []);

  const handleRequestReview = async (jobSeekerId?: string) => {
    if (!requestReview) {
      console.log("CV review not requested, skipping");
      return false;
    }
    
    if (!jobSeekerId) {
      console.error("No job seeker ID provided for CV review request");
      toast({
        title: t('error'),
        description: t('no_job_seeker_profile'),
        variant: "destructive",
      });
      return false;
    }
    
    console.log("Handling CV review request for job seeker ID:", jobSeekerId);
    setLoading(true);
    
    try {
      console.log("Final seeker ID being used:", jobSeekerId, "is_free_review value:", !hasUsedFreeReview);
      
      // Insert new CV review request
      console.log("Inserting new CV review request for job seeker ID:", jobSeekerId);
      const { data, error: insertError } = await supabase
        .from('cv_review_requests')
        .insert({
          job_seeker_id: jobSeekerId,
          status: 'pending',
          is_free_review: !hasUsedFreeReview
        })
        .select();
        
      if (insertError) {
        console.error("Error inserting CV review request:", insertError);
        throw insertError;
      }
      
      console.log("CV review request created:", data);
      
      toast({
        title: t('cv_review_requested'),
        description: t('cv_review_confirmation'),
      });
      
      // Reset form after successful submission
      setRequestReview(false);
      setHasUsedFreeReview(true);
      return true;
    } catch (error) {
      console.error('CV review request error:', error);
      toast({
        title: t('error'),
        description: t('cv_review_error'),
        variant: "destructive",
      });
      return false;
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
