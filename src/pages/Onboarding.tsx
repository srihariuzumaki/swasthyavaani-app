import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/AppLogo";
import { ChevronRight, ChevronLeft, Pill, Activity, Bell, Shield, Mic } from "lucide-react";
import MobileOTPLogin from "@/components/MobileOTPLogin";
import { useAuth } from "@/contexts/AuthContext";

const slides = [
  {
    icon: Mic,
    title: "Talk to AI Assistant",
    description: "Speak naturally in your language. Get instant answers about medicines, symptoms, and health advice powered by AI",
    gradient: "from-primary to-secondary"
  },
  {
    icon: Pill,
    title: "Find Your Medicines",
    description: "Search medicines by name, scan prescriptions, or use voice input in your preferred language",
    gradient: "from-secondary to-accent"
  },
  {
    icon: Activity,
    title: "Check Symptoms",
    description: "Get instant medicine suggestions based on your symptoms with AI-powered recommendations",
    gradient: "from-accent to-primary"
  },
  {
    icon: Bell,
    title: "Never Miss a Dose",
    description: "Set smart reminders for your medications and track your health journey",
    gradient: "from-primary to-accent"
  },
  {
    icon: Shield,
    title: "Your Health, Secured",
    description: "All your health data is encrypted and stored securely on your device",
    gradient: "from-accent to-secondary"
  }
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum swipe distance in pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleNext = () => {
    if (isTransitioning) return;
    
    if (currentSlide < slides.length - 1) {
      setIsTransitioning(true);
      setCurrentSlide(currentSlide + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    } else {
      setShowLogin(true);
    }
  };

  const handlePrevious = () => {
    if (isTransitioning || currentSlide === 0) return;
    
    setIsTransitioning(true);
    setCurrentSlide(currentSlide - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    // Don't set hasAgreedToDisclaimer here - let the Home page show the disclaimer
    navigate("/home");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/home");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/home");
    return null;
  }

  // Show login component
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <MobileOTPLogin onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header with logo */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="text-lg font-semibold text-foreground">Swasthya Vaani</span>
        </div>
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content - Swipeable */}
      <div 
        className="flex-1 flex flex-col items-center justify-center px-6 pb-20 select-none"
        style={{ touchAction: 'pan-x' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`mb-12 rounded-full bg-gradient-to-br ${slide.gradient} p-8 shadow-[var(--shadow-medical)] transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        >
          <Icon className="w-20 h-20 text-white" strokeWidth={1.5} />
        </div>

        <h1 
          className={`text-3xl font-bold text-center mb-4 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
        >
          {slide.title}
        </h1>

        <p 
          className={`text-center text-muted-foreground text-lg max-w-sm transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
          style={{ transitionDelay: isTransitioning ? '0ms' : '100ms' }}
        >
          {slide.description}
        </p>

        {/* Dots */}
        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                ? "w-8 bg-primary"
                : "w-2 bg-border"
                }`}
            />
          ))}
        </div>

        {/* Swipe hint */}
        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground opacity-50">
          {currentSlide > 0 && (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Swipe left or right</span>
            </>
          )}
          {currentSlide === 0 && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>Swipe to continue</span>
            </>
          )}
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
