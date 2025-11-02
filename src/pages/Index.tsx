import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoLoader } from "@/components/ui/logo-loader";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (hasSeenOnboarding) {
      navigate("/home");
    } else {
      navigate("/onboarding");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent">
      <LogoLoader size="lg" showText text="Loading..." />
    </div>
  );
};

export default Index;
