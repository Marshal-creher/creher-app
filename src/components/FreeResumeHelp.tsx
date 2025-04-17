
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';

const FreeResumeHelp: React.FC = () => {
  const { t } = useLanguage();
  
  const tips = [
    { id: 1, text: t('tip_tailor_resume') || 'Tailor your resume for each job application' },
    { id: 2, text: t('tip_bullet_points') || 'Use bullet points to highlight achievements' },
    { id: 3, text: t('tip_measurable_results') || 'Include measurable results and outcomes' },
    { id: 4, text: t('tip_resume_length') || 'Keep your resume to 1-2 pages maximum' },
    { id: 5, text: t('tip_action_verbs') || 'Use action verbs to describe your experience' },
    { id: 6, text: t('tip_keywords') || 'Include relevant keywords from the job description' },
    { id: 7, text: t('tip_professional_summary') || 'Start with a concise professional summary' },
    { id: 8, text: t('tip_proofreading') || 'Proofread carefully for errors and typos' }
  ];
  
  return (
    <div className="space-y-10">
      <section className="bg-gray-50 p-8 rounded-lg">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold text-jobseeker mb-6">
              {t('resume_writing_tips')}
            </h2>
            <ul className="space-y-4">
              {tips.map((tip) => (
                <li key={tip.id} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold text-jobseeker mb-6">
              {t('need_more_help')}
            </h2>
            <p className="mb-4 text-gray-600">
              {t('cv_help_description')}
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="font-medium mb-2">{t('what_you_get')}</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('expert_review')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('personalized_feedback')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('formatting_suggestions')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('career_advice_personal')}</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-jobseeker hover:bg-jobseeker/90 flex items-center gap-2"
                onClick={() => {
                  const element = document.querySelector('[data-value="booking"]');
                  if (element) {
                    (element as HTMLElement).click();
                  }
                }}
              >
                <FileText className="h-4 w-4" />
                {t('book_cv_review')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreeResumeHelp;
