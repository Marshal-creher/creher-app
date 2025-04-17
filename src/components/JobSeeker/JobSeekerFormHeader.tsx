
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from '@/hooks/useLanguageContext';

const JobSeekerFormHeader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <CardHeader>
      <CardTitle className="text-2xl text-jobseeker">{t('create_profile')}</CardTitle>
      <CardDescription>
        {t('profile_description')}
      </CardDescription>
    </CardHeader>
  );
};

export default JobSeekerFormHeader;
