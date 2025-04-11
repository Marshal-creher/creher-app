
import React from 'react';
import { Award, FileText, MessageSquare, Search, Star, UserRound, BriefcaseBusiness, Briefcase, Scale, HardHat } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Features: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <FileText className="h-10 w-10 text-jobseeker" />,
      titleKey: "profile_creation",
      descriptionKey: "profile_creation_desc",
      forJobSeeker: true
    },
    {
      icon: <Search className="h-10 w-10 text-jobseeker" />,
      titleKey: "resume_parsing",
      descriptionKey: "resume_parsing_desc",
      forJobSeeker: true
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-jobseeker" />,
      titleKey: "direct_communication",
      descriptionKey: "direct_communication_desc",
      forJobSeeker: true
    },
    {
      icon: <Star className="h-10 w-10 text-jobseeker" />,
      titleKey: "career_advice",
      descriptionKey: "career_advice_desc",
      forJobSeeker: true
    },
    {
      icon: <Briefcase className="h-10 w-10 text-recruiter" />,
      titleKey: "recruitment_solutions",
      descriptionKey: "recruitment_solutions_desc",
      forJobSeeker: false
    },
    {
      icon: <HardHat className="h-10 w-10 text-recruiter" />,
      titleKey: "work_security_audit",
      descriptionKey: "work_security_audit_desc",
      forJobSeeker: false
    },
    {
      icon: <Scale className="h-10 w-10 text-recruiter" />,
      titleKey: "law_regulations",
      descriptionKey: "law_regulations_desc",
      forJobSeeker: false
    },
    {
      icon: <Award className="h-10 w-10 text-recruiter" />,
      titleKey: "industry_expertise",
      descriptionKey: "industry_expertise_desc",
      forJobSeeker: false
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">{t('how_creher_works')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('features_description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg p-8 shadow-md border border-gray-100">
            <div className="inline-flex items-center justify-center rounded-lg bg-jobseeker/10 p-3 mb-4">
              <UserRound className="h-6 w-6 text-jobseeker" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('for_job_seekers_title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('for_job_seekers_desc')}
            </p>
            <div className="grid grid-cols-1 gap-6">
              {features.filter(f => f.forJobSeeker).map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t(feature.titleKey)}</h4>
                    <p className="text-gray-600 text-sm">{t(feature.descriptionKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-md border border-gray-100">
            <div className="inline-flex items-center justify-center rounded-lg bg-recruiter/10 p-3 mb-4">
              <BriefcaseBusiness className="h-6 w-6 text-recruiter" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('for_recruiters_title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('for_recruiters_desc')}
            </p>
            <div className="grid grid-cols-1 gap-6">
              {features.filter(f => !f.forJobSeeker).map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t(feature.titleKey)}</h4>
                    <p className="text-gray-600 text-sm">{t(feature.descriptionKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
