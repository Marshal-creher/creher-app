
import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Database } from '@/integrations/supabase/types';

type Recruiter = Database['public']['Tables']['recruiters']['Row'];

const RecruiterTable: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('recruiters')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setRecruiters(data);
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
        toast({
          title: t('error'),
          description: t('error_fetching_recruiters'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecruiters();
  }, [t, toast]);

  // Helper function to format consulting needs array
  const formatConsultingNeeds = (needs: string[] | null) => {
    if (!needs || needs.length === 0) return '-';
    return needs.map(need => t(need)).join(', ');
  };

  // Helper function to format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full mt-12 overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-recruiter mb-4">{t('recruiter_submissions')}</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>{loading ? t('loading') : t('recruiter_table_caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('company_name')}</TableHead>
              <TableHead>{t('company_size')}</TableHead>
              <TableHead>{t('industry')}</TableHead>
              <TableHead>{t('consulting_services_needed')}</TableHead>
              <TableHead>{t('date_submitted')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-6 w-6 text-recruiter" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </TableCell>
              </TableRow>
            ) : recruiters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  {t('no_recruiters_found')}
                </TableCell>
              </TableRow>
            ) : (
              recruiters.map((recruiter) => (
                <TableRow key={recruiter.id}>
                  <TableCell>{`${recruiter.first_name} ${recruiter.last_name}`}</TableCell>
                  <TableCell>{recruiter.email}</TableCell>
                  <TableCell>{recruiter.phone}</TableCell>
                  <TableCell>{recruiter.company_name}</TableCell>
                  <TableCell>{t(recruiter.company_size)}</TableCell>
                  <TableCell>{t(recruiter.industry)}</TableCell>
                  <TableCell>{formatConsultingNeeds(recruiter.consulting_needs)}</TableCell>
                  <TableCell>{formatDate(recruiter.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecruiterTable;
