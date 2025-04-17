
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/hooks/useLanguageContext';
import { FileText, Check } from 'lucide-react';

interface JobSeekerDocumentsSectionProps {
  onCVUpload: (file: File | null) => void;
  onCoverLetterUpload?: (file: File | null) => void;
}

const JobSeekerDocumentsSection: React.FC<JobSeekerDocumentsSectionProps> = ({
  onCVUpload,
  onCoverLetterUpload
}) => {
  const { t } = useLanguage();
  const [cvFileName, setCvFileName] = useState<string | null>(null);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFileName(e.target.files[0].name);
      onCVUpload(e.target.files[0]);
    } else {
      setCvFileName(null);
      onCVUpload(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-jobseeker">{t('documents')}</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cv" className="flex items-center gap-2 text-gray-700">
            <FileText size={16} className="text-jobseeker" />
            {t('upload_resume')} (PDF, DOC, DOCX) *
          </Label>
          <div className="relative">
            <Input 
              id="cv"
              name="cv"
              type="file"
              required
              accept=".pdf,.doc,.docx"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
              onChange={handleCvChange}
            />
            {cvFileName && (
              <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md text-sm text-gray-700 flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                {cvFileName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDocumentsSection;
