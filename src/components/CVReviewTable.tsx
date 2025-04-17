
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
import { useCVReview } from '@/hooks/useCVReview';
import LoadingButton from '@/components/ui/loading-button';
import ReviewNotes from '@/components/cv-review/ReviewNotes';
import ReviewServiceOption from '@/components/cv-review/ReviewServiceOption';

const CVReviewTable: React.FC = () => {
  const { t } = useLanguage();
  const { 
    loading, 
    requestReview, 
    setRequestReview, 
    notes, 
    setNotes, 
    hasUsedFreeReview, 
    handleRequestReview 
  } = useCVReview();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">
          {t('cv_review')}
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
              <ReviewServiceOption 
                checked={requestReview}
                hasUsedFreeReview={hasUsedFreeReview}
                onCheckedChange={setRequestReview}
              />
              {requestReview && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <ReviewNotes notes={notes} setNotes={setNotes} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {requestReview && (
            <LoadingButton 
              onClick={handleRequestReview}
              disabled={!requestReview}
              loading={loading}
              loadingText={t('processing')}
              icon={<FileCheck size={18} />}
              className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker/90 text-white"
            >
              {t('request_review')}
            </LoadingButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CVReviewTable;
