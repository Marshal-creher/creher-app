
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/hooks/useLanguageContext';

const JobSeekerDocumentsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('documents')}</h3>
      <div className="space-y-2">
        <Label htmlFor="cv">{t('upload_resume')} (PDF, DOC, DOCX)</Label>
        <Input 
          id="cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lettre">{t('cover_letter')} ({t('optional')})</Label>
        <Input 
          id="lettre"
          name="lettre"
          type="file"
          accept=".pdf,.doc,.docx"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
        />
      </div>
    </div>
  );
};

export default JobSeekerDocumentsSection;
