
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/hooks/useLanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setLanguage('en')}
        className={`w-8 h-8 p-0 ${language === 'en' ? 'bg-gray-200' : ''}`}
      >
        EN
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setLanguage('fr')}
        className={`w-8 h-8 p-0 ${language === 'fr' ? 'bg-gray-200' : ''}`}
      >
        FR
      </Button>
    </div>
  );
};

export default LanguageToggle;
