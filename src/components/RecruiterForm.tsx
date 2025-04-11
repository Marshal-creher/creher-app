
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
  { id: "talent-acquisition", label: "Talent Acquisition Strategy" },
  { id: "sourcing", label: "Candidate Sourcing" },
  { id: "screening", label: "Candidate Screening & Selection" },
  { id: "assessment", label: "Skills Assessment" },
  { id: "employer-branding", label: "Employer Branding" },
  { id: "work-security", label: "Work Security Audit & Formation" },
  { id: "law-regulations", label: "Law Regulations Consulting" },
  { id: "onboarding", label: "Onboarding Optimization" },
  { id: "retention", label: "Employee Retention Strategies" },
  { id: "workforce-planning", label: "Workforce Planning" },
  { id: "other", label: "Other Services" }
];

const RecruiterForm: React.FC = () => {
  const { toast } = useToast();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Consultation Request Submitted!",
        description: "We'll contact you shortly to discuss your recruitment needs.",
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setSize('');
      setIndustry('');
      setSelectedServices([]);
      setConsultingNeeds('');
    }, 1500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-recruiter">Request Recruitment Consulting</CardTitle>
        <CardDescription>
          Tell us about your company and recruitment needs to get specialized consulting services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="Enter your first name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Enter your last name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="Enter your phone number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input 
              id="companyName" 
              placeholder="Enter your company name" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySize.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryTypes.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Consulting Services Needed</Label>
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
                    {service.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consultingNeeds">Describe Your Recruitment Needs</Label>
            <Textarea 
              id="consultingNeeds" 
              placeholder="Please describe your specific recruitment challenges and what you're looking to achieve..." 
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
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MessageSquare size={18} />
                Submit Request
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecruiterForm;
