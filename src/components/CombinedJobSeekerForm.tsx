
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const CombinedJobSeekerForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await fetch('/', {
        method: 'POST',
        body: formData
      });
      
      toast({
        title: "Succès",
        description: "Votre candidature a été envoyée avec succès",
      });
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">Inscription et Candidature</CardTitle>
        <CardDescription>
          Créez votre compte et envoyez votre candidature en une seule étape
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
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations Personnelles</h3>
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
                  placeholder="votre@email.com"
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div className="space-y-2">
              <Label htmlFor="cv">CV (PDF, DOC, DOCX)</Label>
              <Input 
                id="cv"
                name="cv"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jobseeker/10 file:text-jobseeker hover:file:bg-jobseeker/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lettre">Lettre de motivation (optionnel)</Label>
              <Input 
                id="lettre"
                name="lettre"
                type="file"
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
                Envoyer ma candidature
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CombinedJobSeekerForm;
