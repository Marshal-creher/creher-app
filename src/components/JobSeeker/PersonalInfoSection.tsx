import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/hooks/useLanguageContext';

interface PersonalInfoProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="firstName">{t('first_name')}</Label>
        <Input 
          id="firstName" 
          placeholder={t('first_name')} 
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)} 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">{t('last_name')}</Label>
        <Input 
          id="lastName" 
          placeholder={t('last_name')} 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)} 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder={t('email')} 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phone')}</Label>
        <Input 
          id="phone" 
          placeholder={t('phone')} 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
