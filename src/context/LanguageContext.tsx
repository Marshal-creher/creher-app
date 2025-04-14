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
    
    // Form Fields
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'company_name': 'Company Name',
    'company_size': 'Company Size',
    'industry': 'Industry',
    'consulting_services_needed': 'Consulting Services Needed',
    'describe_needs': 'Describe Your Recruitment Needs',
    'request_submitted': 'Request Submitted Successfully!',
    'contact_shortly': "We'll contact you shortly to discuss your consulting needs.",
    'processing': 'Processing...',
    'submit_request': 'Submit Request',
    'error': 'Error',
    'select_at_least_one_service': 'Please select at least one consulting service',
    'enter_first_name': 'Enter your first name',
    'enter_last_name': 'Enter your last name',
    'enter_email': 'Enter your email address',
    'enter_phone': 'Enter your phone number',
    'enter_company_name': 'Enter your company name',
    'select_company_size': 'Select company size',
    'select_industry': 'Select your industry',
    'describe_needs_placeholder': 'Please describe your specific needs and what you\'re looking to achieve...',
    'consulting_form_description': 'Tell us about your company and consulting needs to get specialized HR services.',
    
    // Services
    'Outsourcing of administrative management': 'Outsourcing of Administrative Management',
    'Mediation and conflict management': 'Mediation and Conflict Management',
    'Training on Moroccan labor law': 'Training on Moroccan Labor Law',
    'Compliance with regulations': 'Compliance with Regulations',
    'HR process digitalization': 'HR Process Digitalization',
    'HR security audit': 'HR Security Audit',
    'Workplace accident delegation': 'Workplace Accident Delegation',
    'Workplace safety training': 'Workplace Safety Training',
    'Social compliance training': 'Social Compliance Training',
    'Recruitment solutions': 'Recruitment Solutions',
    'Other services': 'Other Services',
    
    // Job Seeker Form
    'create_profile': 'Create Your Creher Profile',
    'profile_description': 'Fill out the form below to create your profile and start connecting with recruiters.',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'job_category': 'Job Category',
    'experience_level': 'Experience Level',
    'preferred_location': 'Preferred Location',
    'upload_resume': 'Upload Resume',
    'cover_letter': 'Cover Letter / Professional Summary',
    'cover_letter_placeholder': 'Briefly describe your professional background, skills, and career goals...',
    'open_to_remote': 'Open to Remote Work',
    'open_to_relocation': 'Open to Relocation',
    'select_job_category': 'Select a job category',
    'select_experience_level': 'Select your experience level',
    'enter_location': 'Enter city name',
    'file_upload_text': 'Select File',
    'no_file_selected': 'No file selected (PDF, DOC, DOCX)',
    'create_profile_button': 'Create Profile',
    'processing': 'Processing...',
    'profile_submitted': 'Profile Submitted!',
    'profile_success': 'Your Creher profile has been created successfully.',
    'required_field': 'This field is required',
    
    // Job Categories
    'Technology & IT': 'Technology & IT',
    'Marketing & Communications': 'Marketing & Communications',
    'Finance & Accounting': 'Finance & Accounting',
    'Human Resources': 'Human Resources',
    'Sales & Business Development': 'Sales & Business Development',
    'Administrative & Office Support': 'Administrative & Office Support',
    'Design & Creative': 'Design & Creative',
    'Healthcare & Medicine': 'Healthcare & Medicine',
    'Education & Training': 'Education & Training',
    'Engineering & Architecture': 'Engineering & Architecture',
    'Legal': 'Legal',
    'Customer Service': 'Customer Service',
    'Other': 'Other',

    // Experience Levels
    'Entry Level (0-2 years)': 'Entry Level (0-2 years)',
    'Mid Level (3-5 years)': 'Mid Level (3-5 years)',
    'Senior Level (6-10 years)': 'Senior Level (6-10 years)',
    'Executive Level (10+ years)': 'Executive Level (10+ years)',

    // Company Sizes
    '1-10 employees': '1-10 employees',
    '11-50 employees': '11-50 employees',
    '51-200 employees': '51-200 employees',
    '201-500 employees': '201-500 employees',
    '501-1000 employees': '501-1000 employees',
    '1000+ employees': '1000+ employees',

    // Industry Types
    'Technology & Software': 'Technology & Software',
    'Healthcare & Pharmaceuticals': 'Healthcare & Pharmaceuticals',
    'Financial Services & Banking': 'Financial Services & Banking',
    'Retail & E-commerce': 'Retail & E-commerce',
    'Manufacturing & Production': 'Manufacturing & Production',
    'Education & Training': 'Education & Training',
    'Media & Entertainment': 'Media & Entertainment',
    'Government & Public Sector': 'Government & Public Sector',
    'Telecommunications': 'Telecommunications',
    'Food & Hospitality': 'Food & Hospitality',
    'Construction & Real Estate': 'Construction & Real Estate',
    'Other': 'Other',
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
    
    // Form Fields
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'email': 'Adresse Email',
    'phone': 'Numéro de Téléphone',
    'company_name': 'Nom de l\'Entreprise',
    'company_size': 'Taille de l\'Entreprise',
    'industry': 'Secteur d\'Activité',
    'consulting_services_needed': 'Services de Conseil Souhaités',
    'describe_needs': 'Décrivez Vos Besoins',
    'request_submitted': 'Demande Envoyée avec Succès !',
    'contact_shortly': 'Nous vous contacterons prochainement pour discuter de vos besoins.',
    'processing': 'Traitement en cours...',
    'submit_request': 'Envoyer la Demande',
    'error': 'Erreur',
    'select_at_least_one_service': 'Veuillez sélectionner au moins un service de conseil',
    'enter_first_name': 'Entrez votre prénom',
    'enter_last_name': 'Entrez votre nom',
    'enter_email': 'Entrez votre adresse email',
    'enter_phone': 'Entrez votre numéro de téléphone',
    'enter_company_name': 'Entrez le nom de votre entreprise',
    'select_company_size': 'Sélectionnez la taille de l\'entreprise',
    'select_industry': 'Sélectionnez votre secteur d\'activité',
    'describe_needs_placeholder': 'Veuillez décrire vos besoins spécifiques et vos objectifs...',
    'consulting_form_description': 'Parlez-nous de votre entreprise et de vos besoins en conseil pour obtenir des services RH spécialisés.',
    
    // Services
    'Outsourcing of administrative management': 'Externalisation de la Gestion Administrative',
    'Mediation and conflict management': 'Médiation et Gestion des Conflits',
    'Training on Moroccan labor law': 'Formation en Droit du Travail Marocain',
    'Compliance with regulations': 'Conformité aux Réglementations',
    'HR process digitalization': 'Digitalisation des Processus RH',
    'HR security audit': 'Audit de Sécurité RH',
    'Workplace accident delegation': 'Délégation des Accidents de Travail',
    'Workplace safety training': 'Formation à la Sécurité au Travail',
    'Social compliance training': 'Formation à la Conformité Sociale',
    'Recruitment solutions': 'Solutions de Recrutement',
    'Other services': 'Autres Services',
    
    // Job Seeker Form
    'create_profile': 'Créer Votre Profil Creher',
    'profile_description': 'Remplissez le formulaire ci-dessous pour créer votre profil et commencer à échanger avec les recruteurs.',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'email': 'Adresse Email',
    'phone': 'Numéro de Téléphone',
    'job_category': 'Catégorie d\'Emploi',
    'experience_level': 'Niveau d\'Expérience',
    'preferred_location': 'Localisation Souhaitée',
    'upload_resume': 'Télécharger CV',
    'cover_letter': 'Lettre de Motivation / Résumé Professionnel',
    'cover_letter_placeholder': 'Décrivez brièvement votre parcours professionnel, vos compétences et vos objectifs de carrière...',
    'open_to_remote': 'Ouvert au Travail à Distance',
    'open_to_relocation': 'Ouvert à la Mobilité',
    'select_job_category': 'Sélectionnez une catégorie d\'emploi',
    'select_experience_level': 'Sélectionnez votre niveau d\'expérience',
    'enter_location': 'Entrez le nom de la ville',
    'file_upload_text': 'Sélectionner un Fichier',
    'no_file_selected': 'Aucun fichier sélectionné (PDF, DOC, DOCX)',
    'create_profile_button': 'Créer le Profil',
    'processing': 'Traitement en cours...',
    'profile_submitted': 'Profil Soumis !',
    'profile_success': 'Votre profil Creher a été créé avec succès.',
    'required_field': 'Ce champ est obligatoire',
    
    // Job Categories
    'Technology & IT': 'Technologie & Informatique',
    'Marketing & Communications': 'Marketing & Communication',
    'Finance & Accounting': 'Finance & Comptabilité',
    'Human Resources': 'Ressources Humaines',
    'Sales & Business Development': 'Ventes & Développement Commercial',
    'Administrative & Office Support': 'Support Administratif & Bureau',
    'Design & Creative': 'Design & Création',
    'Healthcare & Medicine': 'Santé & Médecine',
    'Education & Training': 'Éducation & Formation',
    'Engineering & Architecture': 'Ingénierie & Architecture',
    'Legal': 'Juridique',
    'Customer Service': 'Service Client',
    'Other': 'Autre',

    // Experience Levels
    'Entry Level (0-2 years)': 'Débutant (0-2 ans)',
    'Mid Level (3-5 years)': 'Intermédiaire (3-5 ans)',
    'Senior Level (6-10 years)': 'Senior (6-10 ans)',
    'Executive Level (10+ years)': 'Cadre Supérieur (10+ ans)',

    // Company Sizes
    '1-10 employees': '1-10 employés',
    '11-50 employees': '11-50 employés',
    '51-200 employees': '51-200 employés',
    '201-500 employees': '201-500 employés',
    '501-1000 employees': '501-1000 employés',
    '1000+ employees': '1000+ employés',

    // Industry Types
    'Technology & Software': 'Technologie & Logiciels',
    'Healthcare & Pharmaceuticals': 'Santé & Pharmaceutique',
    'Financial Services & Banking': 'Services Financiers & Bancaires',
    'Retail & E-commerce': 'Commerce & E-commerce',
    'Manufacturing & Production': 'Fabrication & Production',
    'Education & Training': 'Éducation & Formation',
    'Media & Entertainment': 'Médias & Divertissement',
    'Government & Public Sector': 'Gouvernement & Secteur Public',
    'Telecommunications': 'Télécommunications',
    'Food & Hospitality': 'Alimentation & Hôtellerie',
    'Construction & Real Estate': 'Construction & Immobilier',
    'Other': 'Autre',
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
