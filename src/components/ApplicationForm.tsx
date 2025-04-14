
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, User, Upload } from "lucide-react";

const ApplicationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Merci",
        description: "Votre candidature a bien été reçue.",
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
      
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          name="prenom"
          placeholder="Prénom"
          required
          className="pl-10"
        />
      </div>

      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          name="nom"
          placeholder="Nom"
          required
          className="pl-10"
        />
      </div>

      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="tel"
          name="telephone"
          placeholder="Téléphone"
          required
          className="pl-10"
        />
      </div>

      <div className="relative">
        <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="file"
          name="cv"
          accept=".pdf,.doc,.docx"
          required
          className="pl-10"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-jobseeker hover:bg-jobseeker/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Envoi en cours..." : "Envoyer"}
      </Button>
    </form>
  );
};

export default ApplicationForm;
