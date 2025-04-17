
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
import LoadingButton from "@/components/ui/loading-button";

interface SubmitButtonProps {
  loading: boolean;
  uploadingFiles: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading, uploadingFiles }) => {
  const { t } = useLanguage();
  
  return (
    <LoadingButton 
      type="submit" 
      className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker/90 text-white" 
      disabled={loading || uploadingFiles}
      loading={loading || uploadingFiles}
      loadingText={uploadingFiles ? t('uploading_files') : t('sending')}
      icon={<FileText size={18} />}
    >
      {t('create_profile_button')}
    </LoadingButton>
  );
};

export default SubmitButton;
