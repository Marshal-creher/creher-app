
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, UserRound } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="hero-gradient py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Connecting <span className="text-jobseeker">Job Seekers</span> with <span className="text-recruiter">Recruiters</span>
            </h1>
            <p className="text-lg text-gray-600">
              <span className="italic font-medium">Value Every Relationship</span> - Whether you're looking for your next career opportunity or seeking the best talent for your company, 
              CREHER bridges the gap with our specialized platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/job-seeker">
                <Button className="w-full sm:w-auto bg-jobseeker hover:bg-jobseeker-dark text-white h-12 px-6 flex items-center gap-2">
                  <UserRound size={20} />
                  I'm a Job Seeker
                </Button>
              </Link>
              <Link to="/recruiter">
                <Button className="w-full sm:w-auto bg-recruiter hover:bg-recruiter-dark text-white h-12 px-6 flex items-center gap-2">
                  <BriefcaseBusiness size={20} />
                  I'm a Recruiter
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -top-4 -left-4 bg-jobseeker w-20 h-20 rounded-lg opacity-20"></div>
              <div className="absolute -bottom-4 -right-4 bg-recruiter w-20 h-20 rounded-lg opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Job seeker and recruiter shaking hands" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
