import React from 'react';
import Layout from '@/components/Layout';
import JobSeekerForm from '@/components/JobSeekerForm';
import ApplicationForm from '@/components/ApplicationForm';
import { UserRound } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
            <h1 className="text-3xl font-bold mb-4">Creher Candidate Profile</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create your professional profile and upload your resume to connect with top recruiters in your field.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <JobSeekerForm />
          </div>
        </div>
      </div>
      <ApplicationForm />
    </Layout>
  );
};

export default JobSeeker;
