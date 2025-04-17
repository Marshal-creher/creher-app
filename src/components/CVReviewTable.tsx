
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
import { useCVReview } from '@/hooks/useCVReview';
import LoadingButton from '@/components/ui/loading-button';
import ReviewServiceOption from '@/components/cv-review/ReviewServiceOption';

interface CVReviewTableProps {
  isFormValid: boolean;
  hasCVUploaded: boolean;
  onSubmitBoth: () => void;
}

const CVReviewTable: React.FC<CVReviewTableProps> = ({ 
  isFormValid, 
  hasCVUploaded,
  onSubmitBoth
}) => {
  const { t } = useLanguage();
  const { 
    loading, 
    requestReview, 
    setRequestReview, 
    hasUsedFreeReview, 
    handleRequestReview 
  } = useCVReview();

  const isReviewEnabled = isFormValid && hasCVUploaded;
  
  // If form not valid or CV not uploaded, disable the review option
  React.useEffect(() => {
    if (!isReviewEnabled && requestReview) {
      setRequestReview(false);
    }
  }, [isReviewEnabled, requestReview, setRequestReview]);

  const handleSubmitBothClick = () => {
    if (requestReview) {
      onSubmitBoth();
    } else {
      handleRequestReview();
    }
  };

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
                disabled={!isReviewEnabled}
              />
              {!isReviewEnabled && requestReview && (
                <TableRow>
                  <TableCell colSpan={2} className="text-amber-600 text-sm">
                    {!hasCVUploaded ? t('upload_cv_to_enable_review') : t('complete_form_to_enable_review')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {requestReview && (
            <LoadingButton 
              onClick={handleSubmitBothClick}
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
