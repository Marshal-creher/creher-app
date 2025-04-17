
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface JobSeekerFormProps {
  onSubmitSuccess?: () => void;
}

const JobSeekerForm: React.FC<JobSeekerFormProps> = ({ onSubmitSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get('prenom') as string;
      const lastName = formData.get('nom') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('telephone') as string;
      const cvFile = formData.get('cv') as File;
      
      console.log("Starting job seeker form submission...");
      console.log("CV File:", cvFile ? cvFile.name : "No file");
      
      // Upload CV file to Supabase Storage
      let cvUrl = null;
      if (cvFile && cvFile instanceof File && cvFile.size > 0) {
        const cvFileName = `${Date.now()}_${cvFile.name}`;
        
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(cvFile.type)) {
          throw new Error(`File type ${cvFile.type} is not supported. Please upload PDF or Word documents.`);
        }
        
        console.log("Uploading CV to storage...");
        const { data: cvData, error: cvError } = await supabase.storage
          .from('job_seeker_documents')
          .upload(cvFileName, cvFile, {
            contentType: cvFile.type,
            cacheControl: '3600'
          });
          
        if (cvError) {
          console.error("CV upload error:", cvError);
          throw new Error(`CV upload error: ${cvError.message}`);
        }
        
        console.log("CV uploaded successfully:", cvData);
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl: cvPublicUrl } } = supabase.storage
          .from('job_seeker_documents')
          .getPublicUrl(cvFileName);
          
        cvUrl = cvPublicUrl;
        console.log("CV Public URL:", cvUrl);
      }
      
      // Save data to Supabase
      console.log("Saving data to database...");
      // Use the 'from' method without type constraints for tables not in the TypeScript definitions
      const { error } = await supabase
        .from('job_seekers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          cv_url: cvUrl
        });
        
      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      console.log("Data saved successfully to database");
      
      // Also send to Netlify forms as a backup
      try {
        await fetch('/', {
          method: 'POST',
          body: formData
        });
        console.log("Data submitted to Netlify forms");
      } catch (netlifyError) {
        console.warn("Netlify form submission error (non-critical):", netlifyError);
        // Continue since this is just a backup
      }
      
      toast({
        title: t ? t('success') : "Succès",
        description: t ? t('application_submitted') : "Merci pour votre envoi",
      });
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      
      // Call the success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t ? t('error') : "Erreur",
        description: error instanceof Error ? error.message : (t ? t('submission_error') : "Une erreur s'est produite. Veuillez réessayer."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">Formulaire de candidature</CardTitle>
        <CardDescription>
          Remplissez le formulaire ci-dessous pour postuler
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          name="contact" 
          method="POST" 
          data-netlify="true" 
          encType="multipart/form-data"
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="contact" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input 
                id="prenom"
                name="prenom"
                type="text"
                required
                placeholder="Votre prénom"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input 
                id="nom"
                name="nom"
                type="text"
                required
                placeholder="Votre nom"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                required
                placeholder="Votre email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input 
                id="telephone"
                name="telephone"
                type="tel"
                required
                placeholder="Votre numéro de téléphone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cv">CV</Label>
              <Input 
                id="cv"
                name="cv"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker/90 text-white" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText size={18} />
                Envoyer
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobSeekerForm;
