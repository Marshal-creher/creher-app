
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, UserRound, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguageContext';
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
          <Link to="/crm">
            <Button variant="ghost" className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:bg-purple-50">
              <LayoutGrid size={18} />
              HRM
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
          <Link to="/crm" className="hidden sm:block">
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1">
              <LayoutGrid size={16} />
              HRM
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
