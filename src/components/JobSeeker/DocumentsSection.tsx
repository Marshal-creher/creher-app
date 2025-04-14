
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from '@/context/LanguageContext';
import { Upload } from 'lucide-react';

interface DocumentsSectionProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  coverLetter: string;
  setCoverLetter: (value: string) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  resumeFile,
  setResumeFile,
  coverLetter,
  setCoverLetter,
}) => {
  const { t } = useLanguage();

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="resume">{t('upload_resume')}</Label>
        <div className="border border-input rounded-md p-2">
          <div className="flex items-center">
            <label htmlFor="resumeUpload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2 py-2 px-4 rounded-md">
              <Upload size={18} />
              {t('file_upload_text')}
            </label>
            <input
              id="resumeUpload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <span className="ml-4 text-gray-600 text-sm">
              {resumeFile ? resumeFile.name : t('no_file_selected')}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverLetter">{t('cover_letter')}</Label>
        <Textarea 
          id="coverLetter" 
          placeholder={t('cover_letter_placeholder')} 
          value={coverLetter} 
          onChange={(e) => setCoverLetter(e.target.value)} 
          className="min-h-[120px]" 
          required 
        />
      </div>
    </div>
  );
};

export default DocumentsSection;
