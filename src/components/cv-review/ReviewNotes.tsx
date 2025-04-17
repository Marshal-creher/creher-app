import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/hooks/useLanguageContext';

interface ReviewNotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

const ReviewNotes: React.FC<ReviewNotesProps> = ({ notes, setNotes }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-2 mt-2">
      <Label htmlFor="reviewNotes">{t('additional_notes')}</Label>
      <Textarea
        id="reviewNotes"
        placeholder={t('review_notes_placeholder')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[100px]"
      />
      <p className="text-sm text-gray-500">{t('review_notes_help')}</p>
    </div>
  );
};

export default ReviewNotes;
