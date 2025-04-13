
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';

const Navbar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <nav className="w-full bg-white shadow-sm py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex flex-col items-start">
          <div className="text-xl font-bold flex items-center gap-2">
            <img 
              src="/lovable-uploads/0a8dd22a-7c81-4cb4-9401-5bb711ab32bd.png" 
              alt="CREHER Logo" 
              className="h-10 w-auto"
            />
            <span className="text-creher-navy">CREHER</span>
          </div>
          <span className="text-xs italic text-gray-600 ml-10">{t('slogan')}</span>
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link to="/">
            <Button variant="ghost">{t('home')}</Button>
          </Link>
          <Link to="/job-seeker">
            <Button variant="ghost" className="flex items-center gap-1">
              <UserRound size={18} />
              {t('for_job_seekers')}
            </Button>
          </Link>
          <Link to="/recruiter">
            <Button variant="ghost" className="flex items-center gap-1">
              <BriefcaseBusiness size={18} />
              {t('for_recruiters')}
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <LanguageToggle />
          <Link to="/job-seeker">
            <Button variant="outline" className="hidden sm:flex">{t('find_a_job')}</Button>
          </Link>
          <Link to="/recruiter">
            <Button className="bg-secondary hover:bg-recruiter-dark text-white">{t('hire_talent')}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
