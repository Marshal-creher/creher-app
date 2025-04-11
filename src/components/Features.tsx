
import React from 'react';
import { Award, Clock, FileText, MessageSquare, PenSquare, Search, Shield, Star, UserRound, BriefcaseBusiness } from 'lucide-react';

const features = [
  {
    icon: <FileText className="h-10 w-10 text-jobseeker" />,
    title: "Profile Creation",
    description: "Create a professional profile that showcases your skills and experience to potential employers.",
    forJobSeeker: true
  },
  {
    icon: <Search className="h-10 w-10 text-jobseeker" />,
    title: "Resume Parsing",
    description: "Our advanced resume parsing technology extracts your skills and experience automatically.",
    forJobSeeker: true
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-jobseeker" />,
    title: "Direct Communication",
    description: "Connect directly with recruiters who match your skills and career aspirations.",
    forJobSeeker: true
  },
  {
    icon: <Star className="h-10 w-10 text-jobseeker" />,
    title: "Career Advice",
    description: "Get personalized career advice and insights from industry professionals.",
    forJobSeeker: true
  },
  {
    icon: <PenSquare className="h-10 w-10 text-recruiter" />,
    title: "Consulting Services",
    description: "Expert recruitment consulting tailored to your company's specific needs and industry.",
    forJobSeeker: false
  },
  {
    icon: <Search className="h-10 w-10 text-recruiter" />,
    title: "Talent Matching",
    description: "Advanced algorithms match you with candidates that fit your requirements perfectly.",
    forJobSeeker: false
  },
  {
    icon: <Shield className="h-10 w-10 text-recruiter" />,
    title: "Recruitment Solutions",
    description: "Comprehensive end-to-end recruitment services and specialized solutions.",
    forJobSeeker: false
  },
  {
    icon: <Award className="h-10 w-10 text-recruiter" />,
    title: "Industry Expertise",
    description: "Benefit from our deep understanding of various industries and their unique requirements.",
    forJobSeeker: false
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How JobSeeker Compass Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A comprehensive platform designed to benefit both job seekers and recruiters with powerful features.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg p-8 shadow-md border border-gray-100">
            <div className="inline-flex items-center justify-center rounded-lg bg-jobseeker/10 p-3 mb-4">
              <UserRound className="h-6 w-6 text-jobseeker" />
            </div>
            <h3 className="text-xl font-bold mb-2">For Job Seekers</h3>
            <p className="text-gray-600 mb-6">
              Tools and features to help you showcase your skills, find the right opportunities, and connect with top recruiters.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {features.filter(f => f.forJobSeeker).map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-md border border-gray-100">
            <div className="inline-flex items-center justify-center rounded-lg bg-recruiter/10 p-3 mb-4">
              <BriefcaseBusiness className="h-6 w-6 text-recruiter" />
            </div>
            <h3 className="text-xl font-bold mb-2">For Recruiters</h3>
            <p className="text-gray-600 mb-6">
              Specialized consulting services and tools to optimize your recruitment process and find the best talent.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {features.filter(f => !f.forJobSeeker).map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
