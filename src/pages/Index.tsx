import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      <div className="text-center text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    </div>
  );
};

export default Index;
