
import React from 'react';
import Layout from '@/components/Layout';
import CombinedJobSeekerForm from '@/components/CombinedJobSeekerForm';
import { UserRound } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
import CVReviewTable from '@/components/CVReviewTable';

const JobSeeker: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Layout>
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-jobseeker/10 rounded-full mb-4">
              <UserRound className="h-10 w-10 text-jobseeker" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{t('registration_and_application')}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('create_account_and_apply')}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <CombinedJobSeekerForm />
            
            <div className="mt-10">
              <CVReviewTable />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobSeeker;
