
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/hooks/useLanguageContext';
import { FileUp } from 'lucide-react';

interface JobSeekerDocumentsSectionProps {
  onCVUpload: (file: File | null) => void;
  onCoverLetterUpload: (file: File | null) => void;
}

const JobSeekerDocumentsSection: React.FC<JobSeekerDocumentsSectionProps> = ({
  onCVUpload,
  onCoverLetterUpload
}) => {
  const { t } = useLanguage();
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [coverLetterFileName, setCoverLetterFileName] = useState<string | null>(null);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFileName(e.target.files[0].name);
      onCVUpload(e.target.files[0]);
    } else {
      setCvFileName(null);
      onCVUpload(null);
    }
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverLetterFileName(e.target.files[0].name);
      onCoverLetterUpload(e.target.files[0]);
    } else {
      setCoverLetterFileName(null);
      onCoverLetterUpload(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('documents')}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="cv" className="flex items-center gap-2">
          <FileUp size={16} className="text-jobseeker" />
          {t('upload_resume')} (PDF, DOC, DOCX)
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
            <div className="mt-1 text-sm text-gray-500 flex items-center">
              <FileUp className="h-4 w-4 mr-1" />
              {cvFileName}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lettre" className="flex items-center gap-2">
          <FileUp size={16} className="text-jobseeker" />
          {t('cover_letter')} ({t('optional')})
        </Label>
        <div className="relative">
          <Input 
            id="lettre"
            name="lettre"
            type="file"
            accept=".pdf,.doc,.docx"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
            onChange={handleCoverLetterChange}
          />
          {coverLetterFileName && (
            <div className="mt-1 text-sm text-gray-500 flex items-center">
              <FileUp className="h-4 w-4 mr-1" />
              {coverLetterFileName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDocumentsSection;
