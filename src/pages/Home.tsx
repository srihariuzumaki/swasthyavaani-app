import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Camera, Mic, Activity, Pill, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const quickActions = [
  { icon: Activity, label: "Symptom Checker", color: "from-primary to-secondary" },
  { icon: Pill, label: "My Medicines", color: "from-secondary to-accent" },
  { icon: Heart, label: "Health Tips", color: "from-accent to-primary" },
  { icon: TrendingUp, label: "Track Health", color: "from-primary to-accent" },
];

const healthTips = [
  "Drink 8 glasses of water daily",
  "Take medicines after meals unless prescribed otherwise",
  "Exercise for 30 minutes daily",
  "Get 7-8 hours of sleep",
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleVoiceSearch = () => {
    toast.info("Voice search coming soon!");
  };

  const handleCameraSearch = () => {
    toast.info("Camera scan coming soon!");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">Hello, User!</h1>
        <p className="text-white/90">How can we help you today?</p>
        
        {/* Search bar */}
        <div className="mt-6 relative">
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-12 pr-24 py-6 bg-white/95 backdrop-blur border-0 shadow-lg text-foreground placeholder:text-muted-foreground"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button 
              size="icon"
              variant="ghost"
              onClick={handleVoiceSearch}
              className="rounded-full hover:bg-primary/10"
            >
              <Mic className="w-5 h-5 text-primary" />
            </Button>
            <Button 
              size="icon"
              variant="ghost"
              onClick={handleCameraSearch}
              className="rounded-full hover:bg-primary/10"
            >
              <Camera className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index}
                className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:shadow-[var(--shadow-card)] transition-all hover-scale"
                onClick={() => toast.info(`${action.label} coming soon!`)}
              >
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${action.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Health Tips */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Today's Health Tips</h2>
        <div className="space-y-3">
          {healthTips.map((tip, index) => (
            <Card key={index} className="p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-2 h-2 rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
