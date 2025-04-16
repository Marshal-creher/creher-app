
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Check } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from '@/context/LanguageContext';

const CalendarBooking: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  // Generate available time slots (example)
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
  
  const handleConfirmBooking = () => {
    if (!date || !timeSlot) return;
    
    // Here you would typically save the booking to your database
    // For now, we'll just show a success message
    
    setConfirmDialogOpen(false);
    setBookingComplete(true);
    
    toast({
      title: t('booking_confirmed') || "Booking Confirmed",
      description: `${format(date, "EEEE, MMMM d, yyyy")} at ${timeSlot}`,
    });
  };
  
  const disabledDays = {
    before: new Date(),
    after: addDays(new Date(), 30),
  };
  
  if (bookingComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            {t('booking_successful') || "Booking Successful!"}
          </CardTitle>
          <CardDescription>
            {t('booking_confirmation_message') || "Your session has been successfully scheduled. You'll receive a confirmation email shortly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-4">
              <CalendarCheck className="h-5 w-5 text-jobseeker mt-0.5" />
              <div>
                <h3 className="font-medium">{t('date_and_time') || "Date & Time"}</h3>
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
              {t('book_another_session') || "Book Another Session"}
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
          {t('book_cv_session') || "Book a CV Review Session"}
        </CardTitle>
        <CardDescription>
          {t('book_cv_session_description') || "Select a date and time for your free CV review session with one of our experts."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-jobseeker" />
              {t('select_date') || "Select a Date"}
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
              {t('select_time') || "Select a Time"}
            </h3>
            
            {!date ? (
              <div className="border border-dashed rounded-md p-6 text-center text-gray-500">
                {t('please_select_date_first') || "Please select a date first"}
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
                {t('confirm_booking') || "Confirm Booking"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_booking') || "Confirm Your Booking"}</DialogTitle>
            <DialogDescription>
              {t('booking_confirmation_text') || "You're about to book a CV review session for the following date and time:"}
            </DialogDescription>
          </DialogHeader>
          
          {date && timeSlot && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{format(date, "EEEE, MMMM d, yyyy")}</p>
                <p className="text-gray-600">{timeSlot}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {t('cancel') || "Cancel"}
            </Button>
            <Button 
              className="bg-jobseeker hover:bg-jobseeker/90" 
              onClick={handleConfirmBooking}
            >
              {t('confirm') || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CalendarBooking;
