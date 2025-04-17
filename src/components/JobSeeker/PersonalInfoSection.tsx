
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/hooks/useLanguageContext';

const PersonalInfoSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
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
    </>
  );
};

export default PersonalInfoSection;
