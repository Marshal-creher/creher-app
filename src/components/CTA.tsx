import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';

const CTA: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-jobseeker-light via-white to-recruiter-light rounded-xl overflow-hidden shadow-xl">
          <div className="p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-2">{t('ready_to_take_next_step')}</h2>
            <p className="text-gray-600 italic mb-4">{t('slogan')}</p>
            <p className="text-gray-700 max-w-2xl mx-auto mb-8">
              {t('cta_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/job-seeker">
                <Button className="w-full sm:w-auto bg-jobseeker hover:bg-jobseeker-dark text-white h-12 px-6 flex items-center gap-2">
                  <UserRound size={20} />
                  {t('create_job_seeker_profile')}
                </Button>
              </Link>
              <Link to="/recruiter">
                <Button className="w-full sm:w-auto bg-recruiter hover:bg-recruiter-dark text-white h-12 px-6 flex items-center gap-2">
                  <BriefcaseBusiness size={20} />
                  {t('request_recruitment_consulting')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
