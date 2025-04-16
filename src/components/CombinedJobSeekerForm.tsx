import React from 'react';
import JobSeekerForm from '@/components/JobSeekerForm';

interface CombinedJobSeekerFormProps {
  onSubmitSuccess?: () => void;
}

const CombinedJobSeekerForm: React.FC<CombinedJobSeekerFormProps> = ({ onSubmitSuccess }) => {
  
  return (
    <JobSeekerForm onSubmitSuccess={onSubmitSuccess} />
  );
};

export default CombinedJobSeekerForm;
