import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const CombinedJobSeekerForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    const form = document.createElement('form');
    form.setAttribute('name', 'contact');
    form.setAttribute('data-netlify', 'true');
    form.setAttribute('hidden', 'true');
    
    const nameInput = document.createElement('input');
    nameInput.setAttribute('name', 'prenom');
    form.appendChild(nameInput);
    
    const lastNameInput = document.createElement('input');
    lastNameInput.setAttribute('name', 'nom');
    form.appendChild(lastNameInput);
    
    const emailInput = document.createElement('input');
    emailInput.setAttribute('name', 'email');
    form.appendChild(emailInput);
    
    const phoneInput = document.createElement('input');
    phoneInput.setAttribute('name', 'telephone');
    form.appendChild(phoneInput);
    
    const cvInput = document.createElement('input');
    cvInput.setAttribute('name', 'cv');
    form.appendChild(cvInput);
    
    const letterInput = document.createElement('input');
    letterInput.setAttribute('name', 'lettre');
    form.appendChild(letterInput);
    
    document.body.appendChild(form);
    
    return () => {
      document.body.removeChild(form);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      formData.append('form-name', 'contact');
      
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString()
      });
      
      toast({
        title: t('profile_submitted'),
        description: t('profile_success'),
      });
      
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('submission_error'),
        variant: "destructive",
      });
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">{t('create_profile')}</CardTitle>
        <CardDescription>
          {t('profile_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          name="contact" 
          method="POST" 
          data-netlify="true" 
          netlify="true"
          encType="multipart/form-data"
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="contact" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('first_name')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="prenom">{t('first_name')}</Label>
                <Input 
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  placeholder={t('first_name')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nom">{t('last_name')}</Label>
                <Input 
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  placeholder={t('last_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={t('email')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone">{t('phone')}</Label>
                <Input 
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required
                  placeholder={t('phone')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('upload_resume')}</h3>
            <div className="space-y-2">
              <Label htmlFor="cv">{t('upload_resume')} (PDF, DOC, DOCX)</Label>
              <Input 
                id="cv"
                name="cv"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lettre">{t('cover_letter')} ({t('other')})</Label>
              <Input 
                id="lettre"
                name="lettre"
                type="file"
                accept=".pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker/90 text-white" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('sending')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText size={18} />
                {t('create_profile_button')}
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CombinedJobSeekerForm;
