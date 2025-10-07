import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageCircle, 
  ChevronDown,
  Headphones
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

const faqs = [
  {
    question: "How do I search for medicines?",
    answer: "You can search for medicines using the search bar on the home screen. You can type the name, scan a prescription using the camera, or use voice input."
  },
  {
    question: "Are the symptom suggestions accurate?",
    answer: "Our symptom checker provides general suggestions based on common symptoms. Always consult a healthcare professional for proper diagnosis and treatment."
  },
  {
    question: "How do I set medication reminders?",
    answer: "Go to the Reminders tab and tap 'Add New Reminder'. Enter the medicine name, time, and frequency to never miss a dose."
  },
  {
    question: "Is my health data secure?",
    answer: "Yes, all your health data is encrypted and stored securely on your device. We prioritize your privacy and security."
  },
  {
    question: "Which languages are supported?",
    answer: "The app supports English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and Kannada. You can change the language from your profile settings."
  },
];

const Help = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary via-accent to-primary p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">Help & Support</h1>
        <p className="text-white/90">We're here to help you</p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Quick Contact */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-[var(--shadow-card)] transition-shadow hover-scale"
            onClick={() => toast.info("Calling support...")}
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-secondary">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium">Call Us</span>
          </Card>

          <Card 
            className="p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-[var(--shadow-card)] transition-shadow hover-scale"
            onClick={() => toast.info("Opening email...")}
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-accent to-primary">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium">Email</span>
          </Card>
        </div>

        {/* Voice Help */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Voice-Guided Help</h3>
              <p className="text-sm text-muted-foreground">Get instant help in your language</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-accent"
              onClick={() => toast.info("Voice help coming soon!")}
            >
              Start
            </Button>
          </div>
        </Card>

        {/* FAQs */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Chat Support */}
        <Card className="p-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-secondary to-accent mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Live Chat Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our support team for immediate assistance
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-secondary to-accent"
              onClick={() => toast.info("Chat support coming soon!")}
            >
              Start Chat
            </Button>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Swasthya Vaani</p>
            <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground">
              Your trusted healthcare companion
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Help;
