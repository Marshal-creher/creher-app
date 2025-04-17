
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from '@/hooks/useLanguageContext';

interface ReviewServiceOptionProps {
  checked: boolean;
  hasUsedFreeReview: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const ReviewServiceOption = ({ 
  checked, 
  hasUsedFreeReview, 
  onCheckedChange 
}: ReviewServiceOptionProps) => {
  const { t } = useLanguage();
  
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="requestReview" 
            checked={checked}
            onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
          />
          <div className="ml-2">
            <label 
              htmlFor="requestReview" 
              className="font-medium cursor-pointer"
            >
              {t('request_cv_review')}
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {hasUsedFreeReview 
                ? t('first_review_used') 
                : t('cv_review_description')
              }
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p className="text-center font-medium text-green-600">
          {hasUsedFreeReview 
            ? t('additional_review_price') 
            : t('first_review_free')
          }
        </p>
      </TableCell>
    </TableRow>
  );
};

export default ReviewServiceOption;
