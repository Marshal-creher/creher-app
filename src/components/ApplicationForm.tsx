
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Send } from 'lucide-react';

const ApplicationForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Merci pour votre envoi
        </h2>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50" id="apply">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Postulez maintenant</h2>
        
        <div className="max-w-2xl mx-auto">
          <form
            name="contact"
            method="POST"
            data-netlify="true"
            encType="multipart/form-data"
            className="space-y-6 bg-white p-8 rounded-lg shadow"
            onSubmit={(e) => {
              e.preventDefault();
              // Let Netlify handle the form submission
              setIsSubmitted(true);
            }}
          >
            <input type="hidden" name="form-name" value="contact" />
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                name="prenom"
                type="text"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                name="nom"
                type="text"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">CV (PDF, DOC, DOCX) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cv"
                  name="cv"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  className="w-full"
                />
                <Upload className="h-5 w-5 text-gray-500" />
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" /> Envoyer
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ApplicationForm;
