
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, User, Upload } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';

const ApplicationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Let Netlify handle the form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: t('thank_you'),
        description: t('application_received'),
      });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="form-name" value="contact" />
      
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-sm font-medium">
          {t('first_name')} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="pl-10"
            placeholder={t('enter_first_name')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-sm font-medium">
          {t('last_name')} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="pl-10"
            placeholder={t('enter_last_name')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          {t('phone')} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            className="pl-10"
            placeholder={t('enter_phone')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume" className="text-sm font-medium">
          {t('resume')} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            id="resume"
            name="resume"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            className="pl-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-jobseeker hover:bg-jobseeker/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('sending') : t('send')}
      </Button>
    </form>
  );
};

export default ApplicationForm;
