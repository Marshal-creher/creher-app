
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from '@/hooks/useLanguageContext';

interface PreferencesSectionProps {
  openToRemote: boolean;
  setOpenToRemote: (value: boolean) => void;
  openToRelocation: boolean;
  setOpenToRelocation: (value: boolean) => void;
  preferredSalary?: string;
  setPreferredSalary?: (value: string) => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  openToRemote,
  setOpenToRemote,
  openToRelocation,
  setOpenToRelocation,
  preferredSalary,
  setPreferredSalary
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex items-center space-x-2">
          <Switch 
            id="openToRemote" 
            checked={openToRemote} 
            onCheckedChange={setOpenToRemote} 
          />
          <Label htmlFor="openToRemote">{t('open_to_remote')}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="openToRelocation" 
            checked={openToRelocation} 
            onCheckedChange={setOpenToRelocation} 
          />
          <Label htmlFor="openToRelocation">{t('open_to_relocation')}</Label>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;
