
import React from 'react';
import { useLanguage } from '@/hooks/useLanguageContext';

interface ReviewNotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

const ReviewNotes = ({ notes, setNotes }: ReviewNotesProps) => {
  const { t } = useLanguage();
  
  return (
    <textarea
      className="w-full p-2 border rounded-md h-24 resize-none"
      placeholder={t('cv_review_notes_placeholder')}
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
    />
  );
};

export default ReviewNotes;
