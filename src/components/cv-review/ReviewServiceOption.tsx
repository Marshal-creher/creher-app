
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from '@/hooks/useLanguageContext';

interface ReviewServiceOptionProps {
  checked: boolean;
  hasUsedFreeReview: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ReviewServiceOption = ({ 
  checked, 
  hasUsedFreeReview, 
  onCheckedChange,
  disabled = false
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
            disabled={disabled}
            className={disabled ? "opacity-50 cursor-not-allowed" : ""}
          />
          <div className="ml-2">
            <label 
              htmlFor="requestReview" 
              className={`font-medium ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
