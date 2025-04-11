
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, UserRound } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-white shadow-sm py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex flex-col items-start">
          <div className="text-xl font-bold flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-md flex items-center justify-center">
              <div className="absolute inset-0 bg-creher-navy rounded-md" style={{ clipPath: 'path("M32 0H0V16C0 24.8366 7.16344 32 16 32H32V0Z")' }}></div>
              <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-creher-green rounded-br-md"></div>
            </div>
            <span className="text-creher-navy">CREHER</span>
          </div>
          <span className="text-xs italic text-gray-600 ml-10">Value Every Relationship</span>
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link to="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link to="/job-seeker">
            <Button variant="ghost" className="flex items-center gap-1">
              <UserRound size={18} />
              For Job Seekers
            </Button>
          </Link>
          <Link to="/recruiter">
            <Button variant="ghost" className="flex items-center gap-1">
              <BriefcaseBusiness size={18} />
              For Recruiters
            </Button>
          </Link>
        </div>
        <div className="flex space-x-2">
          <Link to="/job-seeker">
            <Button variant="outline" className="hidden sm:flex">Find a Job</Button>
          </Link>
          <Link to="/recruiter">
            <Button className="bg-secondary hover:bg-recruiter-dark text-white">Hire Talent</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
