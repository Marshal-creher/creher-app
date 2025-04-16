import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BriefcaseBusiness, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from "@/integrations/supabase/client";

const companySize = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees"
];

const industryTypes = [
  "Technology & Software",
  "Healthcare & Pharmaceuticals",
  "Financial Services & Banking",
  "Retail & E-commerce",
  "Manufacturing & Production",
  "Education & Training",
  "Media & Entertainment",
  "Government & Public Sector",
  "Telecommunications",
  "Food & Hospitality",
  "Construction & Real Estate",
  "Other"
];

const consultingServices = [
  { id: "admin-outsourcing", label: "outsourcing_admin" },
  { id: "mediation", label: "mediation_conflict" },
  { id: "labor-law", label: "labor_law_training" },
  { id: "compliance", label: "compliance_regulations" },
  { id: "hr-digital", label: "hr_digitalization" },
  { id: "security-audit", label: "hr_security_audit" },
  { id: "accident-delegation", label: "workplace_accident" },
  { id: "safety-training", label: "workplace_safety" },
  { id: "social-compliance", label: "social_compliance" },
  { id: "recruitment", label: "recruitment_solutions_service" },
  { id: "other", label: "other_services" }
];

const RecruiterForm: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [size, setSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [consultingNeeds, setConsultingNeeds] = useState('');
  const [loading, setLoading] = useState(false);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      toast({
        title: t('error'),
        description: t('select_at_least_one_service'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Save the recruiter data to Supabase
      const { error } = await supabase
        .from('recruiters')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          company_name: companyName,
          company_size: size,
          industry: industry,
          consulting_needs: selectedServices,
          additional_info: consultingNeeds
        });
        
      if (error) throw error;
      
      toast({
        title: t('request_submitted'),
        description: t('contact_shortly'),
      });
      
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setSize('');
      setIndustry('');
      setSelectedServices([]);
      setConsultingNeeds('');
      
    } catch (error) {
      console.error('Error submitting recruiter form:', error);
      toast({
        title: t('error'),
        description: t('submission_error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-recruiter">{t('request_recruitment_consulting')}</CardTitle>
        <CardDescription>
          {t('consulting_form_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-1">
                {t('first_name')}
                <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="firstName" 
                placeholder={t('enter_first_name')} 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-1">
                {t('last_name')}
                <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="lastName" 
                placeholder={t('enter_last_name')} 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                {t('email')}
                <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t('enter_email')} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                {t('phone')}
                <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="phone" 
                placeholder={t('enter_phone')} 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-1">
              {t('company_name')}
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="companyName" 
              placeholder={t('enter_company_name')} 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companySize" className="flex items-center gap-1">
                {t('company_size')}
                <span className="text-destructive">*</span>
              </Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_company_size')} />
                </SelectTrigger>
                <SelectContent>
                  {companySize.map((size) => (
                    <SelectItem key={size} value={size}>{t(size)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry" className="flex items-center gap-1">
                {t('industry')}
                <span className="text-destructive">*</span>
              </Label>
              <Select value={industry} onValueChange={setIndustry} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_industry')} />
                </SelectTrigger>
                <SelectContent>
                  {industryTypes.map((industry) => (
                    <SelectItem key={industry} value={industry}>{t(industry)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {t('consulting_services_needed')}
              <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              {consultingServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={service.id} 
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => handleServiceChange(service.id, checked === true)}
                  />
                  <Label 
                    htmlFor={service.id} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t(service.label)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consultingNeeds" className="flex items-center gap-1">
              {t('describe_needs')}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea 
              id="consultingNeeds" 
              placeholder={t('describe_needs_placeholder')} 
              value={consultingNeeds} 
              onChange={(e) => setConsultingNeeds(e.target.value)} 
              className="min-h-[120px]" 
              required 
            />
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-recruiter hover:bg-recruiter-dark text-white" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MessageSquare size={18} />
                {t('submit_request')}
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecruiterForm;
