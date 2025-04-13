import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';

const jobCategories = [
  "Technology & IT",
  "Marketing & Communications",
  "Finance & Accounting",
  "Human Resources",
  "Sales & Business Development",
  "Administrative & Office Support",
  "Design & Creative",
  "Healthcare & Medicine",
  "Education & Training",
  "Engineering & Architecture",
  "Legal",
  "Customer Service",
  "Other"
];

const experienceLevels = [
  "Entry Level (0-2 years)",
  "Mid Level (3-5 years)",
  "Senior Level (6-10 years)",
  "Executive Level (10+ years)"
];

const JobSeekerForm: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [location, setLocation] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [openToRemote, setOpenToRemote] = useState(true);
  const [openToRelocation, setOpenToRelocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Profile Submitted!",
        description: "Your Creher profile has been created successfully.",
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setJobCategory('');
      setExperienceLevel('');
      setLocation('');
      setResumeFile(null);
      setCoverLetter('');
      setOpenToRemote(true);
      setOpenToRelocation(false);
    }, 1500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">Create Your Creher Profile</CardTitle>
        <CardDescription>
          Fill out the form below to create your profile and start connecting with recruiters.
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
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="jobCategory">Job Category</Label>
              <Select value={jobCategory} onValueChange={setJobCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job category" />
                </SelectTrigger>
                <SelectContent>
                  {jobCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Preferred Location</Label>
            <Input 
              id="location" 
              placeholder="City, State, Country" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Upload Resume</Label>
            <div className="border border-input rounded-md p-2">
              <div className="flex items-center">
                <label htmlFor="resumeUpload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2 py-2 px-4 rounded-md">
                  <Upload size={18} />
                  Select File
                </label>
                <input
                  id="resumeUpload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <span className="ml-4 text-gray-600 text-sm">
                  {resumeFile ? resumeFile.name : "No file selected (PDF, DOC, DOCX)"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter / Professional Summary</Label>
            <Textarea 
              id="coverLetter" 
              placeholder="Briefly describe your professional background, skills, and career goals..." 
              value={coverLetter} 
              onChange={(e) => setCoverLetter(e.target.value)} 
              className="min-h-[120px]" 
              required 
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="openToRemote" 
                checked={openToRemote} 
                onCheckedChange={setOpenToRemote} 
              />
              <Label htmlFor="openToRemote">Open to Remote Work</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="openToRelocation" 
                checked={openToRelocation} 
                onCheckedChange={setOpenToRelocation} 
              />
              <Label htmlFor="openToRelocation">Open to Relocation</Label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-jobseeker hover:bg-jobseeker-dark text-white" 
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
                <FileText size={18} />
                Create Profile
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobSeekerForm;
