
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/hooks/useLanguageContext';
import { UserRound, Mail, Phone } from 'lucide-react';

interface PersonalInfoSectionProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ formData, onChange }) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prenom" className="flex items-center gap-2">
          <UserRound size={16} className="text-jobseeker" />
          {t('first_name')}
        </Label>
        <Input 
          id="prenom"
          name="prenom"
          type="text"
          required
          placeholder={t('first_name')}
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          className="border-gray-300 focus:border-jobseeker focus:ring-jobseeker"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="nom" className="flex items-center gap-2">
          <UserRound size={16} className="text-jobseeker" />
          {t('last_name')}
        </Label>
        <Input 
          id="nom"
          name="nom"
          type="text"
          required
          placeholder={t('last_name')}
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          className="border-gray-300 focus:border-jobseeker focus:ring-jobseeker"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail size={16} className="text-jobseeker" />
          {t('email')}
        </Label>
        <Input 
          id="email"
          name="email"
          type="email"
          required
          placeholder={t('email')}
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="border-gray-300 focus:border-jobseeker focus:ring-jobseeker"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="telephone" className="flex items-center gap-2">
          <Phone size={16} className="text-jobseeker" />
          {t('phone')}
        </Label>
        <Input 
          id="telephone"
          name="telephone"
          type="tel"
          required
          placeholder={t('phone')}
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className="border-gray-300 focus:border-jobseeker focus:ring-jobseeker"
        />
      </div>
    </>
  );
};

export default PersonalInfoSection;
