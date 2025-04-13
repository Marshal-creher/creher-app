import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'fr';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const translations = {
  en: {
    // Navbar
    'home': 'Home',
    'for_job_seekers': 'For Creher Candidates',
    'for_recruiters': 'For Recruiters',
    'find_a_job': 'Find a Job',
    'hire_talent': 'Hire Talent',
    
    // Hero
    'connecting': 'Connecting',
    'job_seekers': 'Creher Candidates',
    'with': 'with',
    'recruiters': 'Recruiters',
    'slogan': 'Value Every Relationship',
    'hero_description': 'Whether you\'re looking for your next career opportunity or seeking the best talent for your company, CREHER bridges the gap with our specialized platform.',
    'im_a_job_seeker': 'I\'m a Creher Candidate',
    'im_a_recruiter': 'I\'m a Recruiter',
    
    // Features
    'how_creher_works': 'How CREHER Works',
    'features_description': 'A comprehensive platform designed to benefit both Creher candidates and recruiters with powerful features.',
    'for_job_seekers_title': 'For Creher Candidates',
    'for_job_seekers_desc': 'Tools and features to help you showcase your skills, find the right opportunities, and connect with top recruiters.',
    'for_recruiters_title': 'For Recruiters',
    'for_recruiters_desc': 'Specialized consulting services and tools to optimize your recruitment process, ensure workplace security, and maintain legal compliance.',
    
    // Features - Job Seekers
    'profile_creation': 'Profile Creation',
    'profile_creation_desc': 'Create a professional profile that showcases your skills and experience to potential employers.',
    'resume_parsing': 'Resume Parsing',
    'resume_parsing_desc': 'Our advanced resume parsing technology extracts your skills and experience automatically.',
    'direct_communication': 'Direct Communication',
    'direct_communication_desc': 'Connect directly with recruiters who match your skills and career aspirations.',
    'career_advice': 'Career Advice',
    'career_advice_desc': 'Get personalized career advice and insights from industry professionals.',
    
    // Features - Recruiters
    'recruitment_solutions': 'Recruitment Solutions',
    'recruitment_solutions_desc': 'Comprehensive recruitment services tailored to your company\'s needs and industry requirements.',
    'work_security_audit': 'Work Security Audit',
    'work_security_audit_desc': 'Thorough assessment and formation on workplace safety and security standards.',
    'law_regulations': 'Law Regulations',
    'law_regulations_desc': 'Expert guidance on employment laws and regulatory compliance for your business.',
    'industry_expertise': 'Industry Expertise',
    'industry_expertise_desc': 'Benefit from our deep understanding of various industries and their unique requirements.',
    
    // CTA
    'ready_to_take_next_step': 'Ready to Take the Next Step?',
    'cta_description': 'Whether you\'re seeking new opportunities or looking for the right talent, CREHER is here to help you succeed.',
    'create_job_seeker_profile': 'Create Creher Candidate Profile',
    'request_recruitment_consulting': 'Request Recruitment Consulting',
    
    // Footer
    'company': 'Company',
    'about_us': 'About Us',
    'contact': 'Contact',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',
    'all_rights_reserved': 'All rights reserved.',
  },
  fr: {
    // Navbar
    'home': 'Accueil',
    'for_job_seekers': 'Pour les Candidats Creher',
    'for_recruiters': 'Pour les Recruteurs',
    'find_a_job': 'Trouver un emploi',
    'hire_talent': 'Recruter',
    
    // Hero
    'connecting': 'Connecter les',
    'job_seekers': 'Candidats Creher',
    'with': 'avec les',
    'recruiters': 'Recruteurs',
    'slogan': 'Valoriser Chaque Relation',
    'hero_description': 'Que vous recherchiez votre prochaine opportunité de carrière ou le meilleur talent pour votre entreprise, CREHER comble le fossé avec notre plateforme spécialisée.',
    'im_a_job_seeker': 'Je suis un Candidat Creher',
    'im_a_recruiter': 'Je suis Recruteur',
    
    // Features
    'how_creher_works': 'Comment fonctionne CREHER',
    'features_description': 'Une plateforme complète conçue pour bénéficier aux candidats Creher et aux recruteurs avec des fonctionnalités puissantes.',
    'for_job_seekers_title': 'Pour les Candidats Creher',
    'for_job_seekers_desc': 'Des outils et des fonctionnalités pour vous aider à mettre en valeur vos compétences, trouver les bonnes opportunités et vous connecter avec les meilleurs recruteurs.',
    'for_recruiters_title': 'Pour les Recruteurs',
    'for_recruiters_desc': 'Services de conseil spécialisés et outils pour optimiser votre processus de recrutement, assurer la sécurité au travail et maintenir la conformité légale.',
    
    // Features - Job Seekers
    'profile_creation': 'Création de Profil',
    'profile_creation_desc': 'Créez un profil professionnel qui met en valeur vos compétences et votre expérience auprès des employeurs potentiels.',
    'resume_parsing': 'Analyse de CV',
    'resume_parsing_desc': 'Notre technologie avancée d\'analyse de CV extrait automatiquement vos compétences et votre expérience.',
    'direct_communication': 'Communication Directe',
    'direct_communication_desc': 'Connectez-vous directement avec les recruteurs qui correspondent à vos compétences et aspirations professionnelles.',
    'career_advice': 'Conseil de Carrière',
    'career_advice_desc': 'Obtenez des conseils de carrière personnalisés et des insights de professionnels de l\'industrie.',
    
    // Features - Recruiters
    'recruitment_solutions': 'Solutions de Recrutement',
    'recruitment_solutions_desc': 'Services de recrutement complets adaptés aux besoins de votre entreprise et aux exigences de votre secteur.',
    'work_security_audit': 'Audit de Sécurité au Travail',
    'work_security_audit_desc': 'Évaluation et formation approfondies sur les normes de sécurité et de sûreté en milieu de travail.',
    'law_regulations': 'Réglementations Juridiques',
    'law_regulations_desc': 'Conseils d\'experts sur les lois du travail et la conformité réglementaire pour votre entreprise.',
    'industry_expertise': 'Expertise Sectorielle',
    'industry_expertise_desc': 'Bénéficiez de notre compréhension approfondie des différentes industries et de leurs exigences uniques.',
    
    // CTA
    'ready_to_take_next_step': 'Prêt à passer à l\'étape suivante?',
    'cta_description': 'Que vous recherchiez de nouvelles opportunités ou le bon talent, CREHER est là pour vous aider à réussir.',
    'create_job_seeker_profile': 'Créer un Profil Candidat Creher',
    'request_recruitment_consulting': 'Demander des Services de Recrutement',
    
    // Footer
    'company': 'Entreprise',
    'about_us': 'À Propos',
    'contact': 'Contact',
    'privacy_policy': 'Politique de Confidentialité',
    'terms_of_service': 'Conditions d\'Utilisation',
    'all_rights_reserved': 'Tous droits réservés.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
