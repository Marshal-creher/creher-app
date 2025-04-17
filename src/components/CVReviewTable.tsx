
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { FileCheck } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const CVReviewTable: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestReview, setRequestReview] = useState(false);
  const [notes, setNotes] = useState('');

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
          notes: notes,
          status: 'pending'
        });
        
      if (insertError) {
        console.error("Error inserting CV review request:", insertError);
        throw insertError;
      }
      
      toast({
        title: t('cv_review_requested'),
        description: t('cv_review_confirmation'),
      });
      
      setRequestReview(false);
      setNotes('');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">
          {t('free_cv_review')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2}>{t('cv_review_service')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="requestReview" 
                      checked={requestReview}
                      onCheckedChange={(checked) => setRequestReview(checked as boolean)}
                    />
                    <div className="ml-2">
                      <label 
                        htmlFor="requestReview" 
                        className="font-medium cursor-pointer"
                      >
                        {t('request_cv_review')}
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('cv_review_description')}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-center font-medium text-green-600">{t('free')}</p>
                </TableCell>
              </TableRow>
              {requestReview && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <textarea
                      className="w-full p-2 border rounded-md h-24 resize-none"
                      placeholder={t('cv_review_notes_placeholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {requestReview && (
            <Button 
              onClick={handleRequestReview}
              disabled={loading || !requestReview}
              className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker/90 text-white"
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
                  <FileCheck size={18} />
                  {t('request_review')}
                </span>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CVReviewTable;
