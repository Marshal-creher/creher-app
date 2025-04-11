
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "JobSeeker Compass helped me find my dream job in just two weeks. The platform is intuitive and the connections with recruiters were invaluable.",
    name: "Sarah Johnson",
    title: "Software Engineer",
    avatar: "SJ",
    isJobSeeker: true
  },
  {
    quote: "After struggling to find qualified candidates, JobSeeker Compass provided us with exactly what we needed. Their consulting services are top-notch.",
    name: "Michael Chen",
    title: "HR Director",
    avatar: "MC",
    isJobSeeker: false
  },
  {
    quote: "The personalized career advice I received through this platform gave me the confidence to pursue a career change. I couldn't be happier with the result.",
    name: "Emma Rodriguez",
    title: "Marketing Specialist",
    avatar: "ER",
    isJobSeeker: true
  },
  {
    quote: "As a recruitment agency, we've seen a 40% increase in successful placements since partnering with JobSeeker Compass. Their solutions are game-changing.",
    name: "David Thompson",
    title: "Recruitment Manager",
    avatar: "DT",
    isJobSeeker: false
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from job seekers who found their ideal positions and recruiters who discovered exceptional talent through our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-8">
                <div className={`w-12 h-1 mb-6 rounded ${testimonial.isJobSeeker ? 'bg-jobseeker' : 'bg-recruiter'}`}></div>
                <blockquote className="text-lg mb-6 italic text-gray-700">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src="" alt={testimonial.name} />
                    <AvatarFallback className={testimonial.isJobSeeker ? 'bg-jobseeker/20 text-jobseeker' : 'bg-recruiter/20 text-recruiter'}>
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
