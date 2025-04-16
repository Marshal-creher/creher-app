
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';

const FreeResumeHelp: React.FC = () => {
  const { t } = useLanguage();
  
  const cvTemplates = [
    {
      id: 1,
      title: 'Professional Resume',
      description: 'A clean, modern template for all industries',
      image: '/placeholder.svg',
      downloadUrl: '#professional-template'
    },
    {
      id: 2,
      title: 'Creative Resume',
      description: 'Stand out with a unique design for creative fields',
      image: '/placeholder.svg',
      downloadUrl: '#creative-template'
    },
    {
      id: 3,
      title: 'Technical Resume',
      description: 'Highlight your technical skills and achievements',
      image: '/placeholder.svg',
      downloadUrl: '#technical-template'
    }
  ];
  
  const tips = [
    { id: 1, text: 'Tailor your resume for each job application' },
    { id: 2, text: 'Use bullet points to highlight achievements' },
    { id: 3, text: 'Include measurable results and outcomes' },
    { id: 4, text: 'Keep your resume to 1-2 pages maximum' },
    { id: 5, text: 'Use action verbs to describe your experience' }
  ];
  
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold text-jobseeker mb-6 text-center">
          {t('free_cv_templates') || "Free CV Templates"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cvTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <img 
                  src={template.image} 
                  alt={template.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full text-jobseeker border-jobseeker hover:bg-jobseeker hover:text-white flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('download_template') || "Download Template"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="bg-gray-50 p-8 rounded-lg">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold text-jobseeker mb-6">
              {t('resume_writing_tips') || "Resume Writing Tips"}
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
              {t('need_more_help') || "Need More Help?"}
            </h2>
            <p className="mb-4 text-gray-600">
              {t('cv_help_description') || "Our experts can review your CV and provide personalized feedback to help you stand out to employers."}
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="font-medium mb-2">{t('what_you_get') || "What you'll get:"}</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('expert_review') || "Expert resume review"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('personalized_feedback') || "Personalized feedback"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('formatting_suggestions') || "Formatting suggestions"}</span>
                </li>
              </ul>
              <Button className="w-full bg-jobseeker hover:bg-jobseeker/90 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('book_cv_review') || "Book a CV Review Session"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreeResumeHelp;
