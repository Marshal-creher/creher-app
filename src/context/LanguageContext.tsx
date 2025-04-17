
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
    
    // Recruiter Page
    'recruitment_consulting_title': 'Recruitment Consulting',
    'recruitment_consulting_description': 'Get specialized recruitment consulting services tailored to your company\'s needs and industry requirements.',
    
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
    
    // Form Fields & Messages
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
    'describe_needs_placeholder': 'Please describe your specific needs / Let us know when we can contact you...',
    'consulting_form_description': 'Tell us about your company and consulting needs to get specialized HR services.',
    
    // Job Seeker Form
    'create_profile': 'Create Your Creher Profile',
    'profile_description': 'Fill out the form below to create your profile and start connecting with recruiters.',
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
    'profile_submitted': 'Profile Submitted!',
    'profile_success': 'Your Creher profile has been created successfully.',
    'required_field': 'This field is required',
    'submission_error': 'There was an error submitting your profile. Please try again.',
    
    // Services
    'outsourcing_admin': 'Outsourcing of Administrative Management',
    'mediation_conflict': 'Mediation and Conflict Management',
    'labor_law_training': 'Training on Moroccan Labor Law',
    'compliance_regulations': 'Compliance with Regulations',
    'hr_digitalization': 'HR Process Digitalization',
    'hr_security_audit': 'HR Security Audit',
    'workplace_accident': 'Workplace Accident Delegation',
    'workplace_safety': 'Workplace Safety Training',
    'social_compliance': 'Social Compliance Training',
    'recruitment_solutions_service': 'Recruitment Solutions',
    'other_services': 'Other Services',
    
    // Job Categories
    'tech_it': 'Technology & IT',
    'marketing_communications': 'Marketing & Communications',
    'finance_accounting': 'Finance & Accounting',
    'human_resources': 'Human Resources',
    'sales_business': 'Sales & Business Development',
    'admin_support': 'Administrative & Office Support',
    'design_creative': 'Design & Creative',
    'healthcare_medicine': 'Healthcare & Medicine',
    'education_training': 'Education & Training',
    'engineering_architecture': 'Engineering & Architecture',
    'legal': 'Legal',
    'customer_service': 'Customer Service',
    'other': 'Other',

    // Experience Levels
    'entry_level': 'Entry Level (0-2 years)',
    'mid_level': 'Mid Level (3-5 years)',
    'senior_level': 'Senior Level (6-10 years)',
    'executive_level': 'Executive Level (10+ years)',

    // Company Sizes
    'size_1_10': '1-10 employees',
    'size_11_50': '11-50 employees',
    'size_51_200': '51-200 employees',
    'size_201_500': '201-500 employees',
    'size_501_1000': '501-1000 employees',
    'size_1000_plus': '1000+ employees',

    // Industry Types
    'industry_tech': 'Technology & Software',
    'industry_healthcare': 'Healthcare & Pharmaceuticals',
    'industry_finance': 'Financial Services & Banking',
    'industry_retail': 'Retail & E-commerce',
    'industry_manufacturing': 'Manufacturing & Production',
    'industry_education': 'Education & Training',
    'industry_media': 'Media & Entertainment',
    'industry_government': 'Government & Public Sector',
    'industry_telecom': 'Telecommunications',
    'industry_food': 'Food & Hospitality',
    'industry_construction': 'Construction & Real Estate',
    'industry_other': 'Other',

    // JobSeeker page
    'registration_and_application': 'Registration and Application',
    'create_account_and_apply': 'Create your account and submit your application in one simple step.',
    'sending': 'Sending...',
    'send': 'Send',
    'thanks_for_submission': 'Thank you for your submission',
    'error_occurred': 'An error occurred. Please try again.',
    
    // CV Help and Calendar Booking
    'free_cv_help': 'Free CV Help',
    'book_session': 'Book a Session',
    'complete_form_first': 'Please complete the application form first',
    'go_to_form': 'Go to the application form',
    'resume_writing_tips': 'Resume Writing Tips',
    'need_more_help': 'Need More Help?',
    'cv_help_description': 'Our experts can review your CV and provide personalized feedback to help you stand out to employers.',
    'what_you_get': 'What you\'ll get:',
    'expert_review': 'Expert resume review',
    'personalized_feedback': 'Personalized feedback',
    'formatting_suggestions': 'Formatting suggestions',
    'career_advice_personal': 'One-on-one career advice',
    'book_cv_review': 'Book a CV Review Session',
    'book_cv_session': 'Book a CV Review Session',
    'book_cv_session_description': 'Select a date and time for your free CV review session with one of our experts.',
    'select_date': 'Select a Date',
    'select_time': 'Select a Time',
    'please_select_date_first': 'Please select a date first',
    'confirm_booking': 'Confirm Booking',
    'booking_confirmed': 'Booking Confirmed',
    'booking_successful': 'Booking Successful!',
    'booking_confirmation_message': 'Your session has been successfully scheduled. You\'ll receive a confirmation email shortly.',
    'date_and_time': 'Date & Time',
    'book_another_session': 'Book Another Session',
    'booking_confirmation_text': 'You\'re about to book a CV review session for the following date and time:',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'fill_all_fields': 'Please fill all required fields',
    'booking_error': 'There was an error saving your booking. Please try again.',
    
    // CV Tips
    'tip_tailor_resume': 'Tailor your resume for each job application',
    'tip_bullet_points': 'Use bullet points to highlight achievements',
    'tip_measurable_results': 'Include measurable results and outcomes',
    'tip_resume_length': 'Keep your resume to 1-2 pages maximum',
    'tip_action_verbs': 'Use action verbs to describe your experience',
    'tip_keywords': 'Include relevant keywords from the job description',
    'tip_professional_summary': 'Start with a concise professional summary',
    'tip_proofreading': 'Proofread carefully for errors and typos',
  },
  fr: {
    // Navbar
    'home': 'Accueil',
    'for_job_seekers': 'Pour les Candidats Creher',
    'for_recruiters': 'Pour les Recruteurs',
    'find_a_job': 'Trouver un emploi',
    'hire_talent': 'Recruter',
    
    // Recruiter Page
    'recruitment_consulting_title': 'Services de Recrutement',
    'recruitment_consulting_description': 'Obtenez des services de conseil en recrutement spécialisés adaptés aux besoins de votre entreprise et aux exigences de votre secteur.',
    
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
    
    // Form Fields & Messages
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'email': 'Adresse Email',
    'phone': 'Numéro de Téléphone',
    'company_name': 'Nom de l\'Entreprise',
    'company_size': 'Taille de l\'Entreprise',
    'industry': 'Secteur d\'Activité',
    'consulting_services_needed': 'Services de conseil souhaités',
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
    'describe_needs_placeholder': 'Veuillez décrire vos besoins spécifiques et vos objectifs / indiquez un créneau pour vous contacter...',
    'consulting_form_description': 'Parlez-nous de votre entreprise et de vos besoins en conseil pour obtenir des services RH spécialisés.',
    
    // Job Seeker Form
    'create_profile': 'Créer Votre Profil Creher',
    'profile_description': 'Remplissez le formulaire ci-dessous pour créer votre profil et commencer à échanger avec les recruteurs.',
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
    'profile_submitted': 'Profil Soumis !',
    'profile_success': 'Votre profil Creher a été créé avec succès.',
    'required_field': 'Ce champ est obligatoire',
    'submission_error': 'Une erreur s\'est produite lors de l\'envoi de votre profil. Veuillez réessayer.',
    
    // Services
    'outsourcing_admin': 'Externalisation de la Gestion Administrative',
    'mediation_conflict': 'Médiation et Gestion des Conflits',
    'labor_law_training': 'Formation en Droit du Travail Marocain',
    'compliance_regulations': 'Conformité aux Réglementations',
    'hr_digitalization': 'Digitalisation des Processus RH',
    'hr_security_audit': 'Audit de Sécurité RH',
    'workplace_accident': 'Délégation des Accidents de Travail',
    'workplace_safety': 'Formation à la Sécurité au Travail',
    'social_compliance': 'Formation à la Conformité Sociale',
    'recruitment_solutions_service': 'Solutions de Recrutement',
    'other_services': 'Autres Services',
    
    // Job Categories
    'tech_it': 'Technologie & Informatique',
    'marketing_communications': 'Marketing & Communication',
    'finance_accounting': 'Finance & Comptabilité',
    'human_resources': 'Ressources Humaines',
    'sales_business': 'Ventes & Développement Commercial',
    'admin_support': 'Support Administratif & Bureau',
    'design_creative': 'Design & Création',
    'healthcare_medicine': 'Santé & Médecine',
    'education_training': 'Éducation & Formation',
    'engineering_architecture': 'Ingénierie & Architecture',
    'legal': 'Juridique',
    'customer_service': 'Service Client',
    'other': 'Autre',

    // Experience Levels
    'entry_level': 'Débutant (0-2 ans)',
    'mid_level': 'Intermédiaire (3-5 ans)',
    'senior_level': 'Senior (6-10 ans)',
    'executive_level': 'Cadre Supérieur (10+ ans)',

    // Company Sizes
    'size_1_10': '1-10 employés',
    'size_11_50': '11-50 employés',
    'size_51_200': '51-200 employés',
    'size_201_500': '201-500 employés',
    'size_501_1000': '501-1000 employés',
    'size_1000_plus': '1000+ employés',

    // Industry Types
    'industry_tech': 'Technologie & Logiciels',
    'industry_healthcare': 'Santé & Pharmaceutique',
    'industry_finance': 'Services Financiers & Bancaires',
    'industry_retail': 'Commerce & E-commerce',
    'industry_manufacturing': 'Fabrication & Production',
    'industry_education': 'Éducation & Formation',
    'industry_media': 'Médias & Divertissement',
    'industry_government': 'Gouvernement & Secteur Public',
    'industry_telecom': 'Télécommunications',
    'industry_food': 'Alimentation & Hôtellerie',
    'industry_construction': 'Construction & Immobilier',
    'industry_other': 'Autre',

    // JobSeeker page
    'registration_and_application': 'Inscription et Candidature',
    'create_account_and_apply': 'Créez votre compte et envoyez votre candidature en une seule étape simple.',
    'sending': 'Envoi en cours...',
    'send': 'Envoyer',
    'thanks_for_submission': 'Merci pour votre envoi',
    'error_occurred': 'Une erreur s\'est produite. Veuillez réessayer.',
    
    // CV Help and Calendar Booking
    'free_cv_help': 'Aide CV Gratuite',
    'book_session': 'Réserver une Session',
    'complete_form_first': 'Veuillez d\'abord remplir le formulaire de candidature',
    'go_to_form': 'Aller au formulaire de candidature',
    'resume_writing_tips': 'Conseils pour Rédiger un CV',
    'need_more_help': 'Besoin de Plus d\'Aide?',
    'cv_help_description': 'Nos experts peuvent examiner votre CV et vous fournir des commentaires personnalisés pour vous aider à vous démarquer auprès des employeurs.',
    'what_you_get': 'Ce que vous obtiendrez:',
    'expert_review': 'Examen expert de votre CV',
    'personalized_feedback': 'Commentaires personnalisés',
    'formatting_suggestions': 'Suggestions de mise en forme',
    'career_advice_personal': 'Conseils de carrière individualisés',
    'book_cv_review': 'Réserver une Session d\'Examen de CV',
    'book_cv_session': 'Réserver une Session d\'Examen de CV',
    'book_cv_session_description': 'Sélectionnez une date et une heure pour votre session gratuite d\'examen de CV avec l\'un de nos experts.',
    'select_date': 'Sélectionner une Date',
    'select_time': 'Sélectionner une Heure',
    'please_select_date_first': 'Veuillez d\'abord sélectionner une date',
    'confirm_booking': 'Confirmer la Réservation',
    'booking_confirmed': 'Réservation Confirmée',
    'booking_successful': 'Réservation Réussie!',
    'booking_confirmation_message': 'Votre session a été programmée avec succès. Vous recevrez bientôt un e-mail de confirmation.',
    'date_and_time': 'Date et Heure',
    'book_another_session': 'Réserver une Autre Session',
    'booking_confirmation_text': 'Vous êtes sur le point de réserver une session d\'examen de CV pour la date et l\'heure suivantes:',
    'cancel': 'Annuler',
    'confirm': 'Confirmer',
    'fill_all_fields': 'Veuillez remplir tous les champs requis',
    'booking_error': 'Une erreur s\'est produite lors de l\'enregistrement de votre réservation. Veuillez réessayer.',
    
    // CV Tips
    'tip_tailor_resume': 'Adaptez votre CV à chaque candidature',
    'tip_bullet_points': 'Utilisez des puces pour mettre en évidence vos réalisations',
    'tip_measurable_results': 'Incluez des résultats et des accomplissements mesurables',
    'tip_resume_length': 'Limitez votre CV à 1-2 pages maximum',
    'tip_action_verbs': 'Utilisez des verbes d\'action pour décrire votre expérience',
    'tip_keywords': 'Incluez des mots-clés pertinents de l\'offre d\'emploi',
    'tip_professional_summary': 'Commencez par un résumé professionnel concis',
    'tip_proofreading': 'Relisez attentivement pour éviter les erreurs et les fautes de frappe',
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
