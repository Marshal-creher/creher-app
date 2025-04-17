
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarCheck, Clock, Check } from 'lucide-react';
import { format, addDays, addMonths, isWeekend } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

const CalendarBooking: React.FC = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Generate available time slots
  const availableTimeSlots = [
    "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"
  ];
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTimeSlot(null); // Reset time slot when date changes
  };
  
  const handleTimeSelect = (time: string) => {
    setTimeSlot(time);
  };
  
  const handleConfirmBooking = async () => {
    if (!date || !timeSlot || !firstName || !lastName || !email) {
      toast({
        title: t('error') || "Error",
        description: t('fill_all_fields') || "Please fill all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the generic Supabase client to avoid TypeScript errors with the new table
      // @ts-ignore - Ignoring type check as the table exists in the database but not in TypeScript definitions
      const { error } = await supabase
        .from('resume_review_bookings')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          booking_date: format(date, 'yyyy-MM-dd'),
          booking_time: timeSlot
        });
        
      if (error) throw error;
      
      setConfirmDialogOpen(false);
      setBookingComplete(true);
      
      toast({
        title: t('booking_confirmed') || "Booking Confirmed",
        description: `${format(date, "EEEE, MMMM d, yyyy")} at ${timeSlot}`,
      });
    } catch (error) {
      console.error('Error saving booking:', error);
      toast({
        title: t('error') || "Error",
        description: t('booking_error') || "There was an error saving your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const disabledDays = (date: Date) => {
    // Disable weekends and dates before today or more than 6 months in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = addMonths(today, 6); // Changed from 30 days to 6 months
    return isWeekend(date) || date < today || date > maxDate;
  };
  
  if (bookingComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            {t('booking_successful')}
          </CardTitle>
          <CardDescription>
            {t('booking_confirmation_message')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-4">
              <CalendarCheck className="h-5 w-5 text-jobseeker mt-0.5" />
              <div>
                <h3 className="font-medium">{t('date_and_time')}</h3>
                {date && timeSlot && (
                  <p className="text-gray-600">
                    {format(date, "EEEE, MMMM d, yyyy")} at {timeSlot}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              className="border-jobseeker text-jobseeker hover:bg-jobseeker hover:text-white"
              onClick={() => setBookingComplete(false)}
            >
              {t('book_another_session')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-jobseeker">
          {t('book_cv_session')}
        </CardTitle>
        <CardDescription>
          {t('book_cv_session_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-jobseeker" />
              {t('select_date')}
            </h3>
            <div className="border rounded-md">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={disabledDays}
                className="pointer-events-auto"
              />
            </div>
          </div>
          
          <div className="lg:w-1/2 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-jobseeker" />
              {t('select_time')}
            </h3>
            
            {!date ? (
              <div className="border border-dashed rounded-md p-6 text-center text-gray-500">
                {t('please_select_date_first')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableTimeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={timeSlot === time ? "default" : "outline"}
                    className={timeSlot === time ? "bg-jobseeker hover:bg-jobseeker/90" : ""}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="pt-6">
              <Button
                className="w-full bg-jobseeker hover:bg-jobseeker/90"
                disabled={!date || !timeSlot}
                onClick={() => setConfirmDialogOpen(true)}
              >
                {t('confirm_booking')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_booking')}</DialogTitle>
            <DialogDescription>
              {t('booking_confirmation_text')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {date && timeSlot && (
                <>
                  <p className="font-medium">{format(date, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-gray-600">{timeSlot}</p>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="firstName">{t('first_name')}</Label>
                <Input 
                  id="firstName" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder={t('enter_first_name')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="lastName">{t('last_name')}</Label>
                <Input 
                  id="lastName" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder={t('enter_last_name')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder={t('enter_email')}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button 
              className="bg-jobseeker hover:bg-jobseeker/90" 
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  {t('processing')}
                </span>
              ) : (
                t('confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CalendarBooking;
