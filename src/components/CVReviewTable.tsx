
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { FileCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
import { useCVReview } from '@/hooks/useCVReview';
import LoadingButton from '@/components/ui/loading-button';
import ReviewServiceOption from '@/components/cv-review/ReviewServiceOption';

interface CVReviewTableProps {
  isFormValid: boolean;
  hasCVUploaded: boolean;
  hasUsedFreeReview?: boolean;
  onSubmitBoth: () => void;
}

const CVReviewTable: React.FC<CVReviewTableProps> = ({ 
  isFormValid, 
  hasCVUploaded,
  hasUsedFreeReview = false,
  onSubmitBoth
}) => {
  const { t } = useLanguage();
  const { 
    loading, 
    requestReview, 
    setRequestReview
  } = useCVReview();

  const isReviewEnabled = isFormValid && hasCVUploaded;
  
  return (
    <Card className="border-jobseeker/20 shadow-sm">
      <CardHeader className="bg-jobseeker/5 border-b border-jobseeker/10">
        <CardTitle className="text-2xl text-jobseeker">
          {t('cv_review')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-jobseeker">{t('cv_review_service')}</TableHead>
                <TableHead className="text-right text-jobseeker">{t('price')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ReviewServiceOption 
                checked={requestReview}
                hasUsedFreeReview={hasUsedFreeReview}
                onCheckedChange={setRequestReview}
                disabled={!isReviewEnabled}
              />
              {!isReviewEnabled && (
                <TableRow>
                  <TableHead colSpan={2} className="text-amber-600 text-sm px-4 py-2">
                    {!hasCVUploaded ? t('upload_cv_to_enable_review') : t('complete_form_to_enable_review')}
                  </TableHead>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {requestReview && (
            <LoadingButton 
              onClick={onSubmitBoth}
              disabled={!isReviewEnabled || !requestReview}
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
