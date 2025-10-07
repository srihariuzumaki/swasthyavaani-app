import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Pill, Activity, Bell, Shield } from "lucide-react";

const slides = [
  {
    icon: Pill,
    title: "Find Your Medicines",
    description: "Search medicines by name, scan prescriptions, or use voice input in your preferred language",
    gradient: "from-primary to-secondary"
  },
  {
    icon: Activity,
    title: "Check Symptoms",
    description: "Get instant medicine suggestions based on your symptoms with AI-powered recommendations",
    gradient: "from-secondary to-accent"
  },
  {
    icon: Bell,
    title: "Never Miss a Dose",
    description: "Set smart reminders for your medications and track your health journey",
    gradient: "from-accent to-primary"
  },
  {
    icon: Shield,
    title: "Your Health, Secured",
    description: "All your health data is encrypted and stored securely on your device",
    gradient: "from-primary to-accent"
  }
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem("hasSeenOnboarding", "true");
      navigate("/home");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/home");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className={`mb-12 rounded-full bg-gradient-to-br ${slide.gradient} p-8 shadow-[var(--shadow-medical)] animate-scale-in`}>
          <Icon className="w-20 h-20 text-white" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-4 animate-fade-in">
          {slide.title}
        </h1>
        
        <p className="text-center text-muted-foreground text-lg max-w-sm animate-fade-in">
          {slide.description}
        </p>

        {/* Dots */}
        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Next button */}
      <div className="p-6 pb-8">
        <Button 
          onClick={handleNext}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[var(--shadow-medical)]"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
