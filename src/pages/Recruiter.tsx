
import React from 'react';
import Layout from '@/components/Layout';
import RecruiterForm from '@/components/RecruiterForm';
import RecruiterTable from '@/components/RecruiterTable';
import { BriefcaseBusiness } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';

const Recruiter: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Layout>
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-recruiter/10 rounded-full mb-4">
              <BriefcaseBusiness className="h-10 w-10 text-recruiter" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{t('recruitment_consulting_title')}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('recruitment_consulting_description')}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <RecruiterForm />
            <RecruiterTable />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Recruiter;
