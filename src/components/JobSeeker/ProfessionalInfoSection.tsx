
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/hooks/useLanguageContext';
import CityInput from '../CityInput';

interface ProfessionalInfoProps {
  jobCategory: string;
  setJobCategory: (value: string) => void;
  experienceLevel: string;
  setExperienceLevel: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
}

const jobCategories = [
  "tech_it",
  "marketing_communications",
  "finance_accounting",
  "human_resources",
  "sales_business",
  "admin_support",
  "design_creative",
  "healthcare_medicine",
  "education_training",
  "engineering_architecture",
  "legal",
  "customer_service",
  "other"
];

const experienceLevels = [
  "entry_level",
  "mid_level",
  "senior_level",
  "executive_level"
];

const ProfessionalInfoSection: React.FC<ProfessionalInfoProps> = ({
  jobCategory,
  setJobCategory,
  experienceLevel,
  setExperienceLevel,
  location,
  setLocation,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="jobCategory">{t('job_category')}</Label>
        <Select value={jobCategory} onValueChange={setJobCategory} required>
          <SelectTrigger>
            <SelectValue placeholder={t('select_job_category')} />
          </SelectTrigger>
          <SelectContent>
            {jobCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {t(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="experienceLevel">{t('experience_level')}</Label>
        <Select value={experienceLevel} onValueChange={setExperienceLevel} required>
          <SelectTrigger>
            <SelectValue placeholder={t('select_experience_level')} />
          </SelectTrigger>
          <SelectContent>
            {experienceLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {t(level)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="location">{t('preferred_location')}</Label>
        <CityInput
          value={location}
          onChange={setLocation}
          placeholder={t('enter_location')}
          required
        />
      </div>
    </div>
  );
};

export default ProfessionalInfoSection;
