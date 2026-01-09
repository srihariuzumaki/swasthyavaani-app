import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Camera, Mic, Activity, Pill, Heart, TrendingUp, Bot, LogOut, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LogoLoader } from "@/components/ui/logo-loader";
import AIAssistant from "@/components/AIAssistant";
import ThemeToggle from "@/components/ThemeToggle";
import DisclaimerModal from "@/components/DisclaimerModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { healthTipsService } from '@/lib/healthTipsService';
import { useNavigate } from "react-router-dom";
import apiClient, { MedicineSearchResponse, MedicineData, ApiResponse } from "@/lib/api";

const QuickActions = ({ t }: { t: any }) => [
  { icon: Activity, label: t("home.symptomChecker", { defaultValue: "Symptom Checker" }), color: "from-primary to-secondary" },
  { icon: Pill, label: t("home.myMedicines", { defaultValue: "My Medicines" }), color: "from-secondary to-accent" },
  { icon: Heart, label: t("home.healthTips", { defaultValue: "Health Tips" }), color: "from-accent to-primary" },
  { icon: TrendingUp, label: t("home.trackHealth", { defaultValue: "Track Health" }), color: "from-primary to-accent" },
];



const Home = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const healthTipsRef = useRef<HTMLDivElement>(null);

  const [healthTips, setHealthTips] = useState<string[]>([]);

  useEffect(() => {
    // Get 3 random tips on component mount
    setHealthTips(healthTipsService.getRandomTips(3));
    
    // Schedule periodic health tip notifications
    healthTipsService.schedulePeriodicTips();
  }, []);

  // Check if disclaimer should be shown after onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    const hasAgreedToDisclaimer = localStorage.getItem("hasAgreedToDisclaimer");
    
    // Show disclaimer if user just completed onboarding but hasn't agreed yet
    if (hasSeenOnboarding === "true" && !hasAgreedToDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceSearch = async () => {
    try {
      if (isVoiceRecording) {
        // Stop recording
        setIsVoiceRecording(false);
        setIsProcessingVoice(true);
        
        const voiceService = (await import('@/lib/voiceService')).default;
        const audioBlob = await voiceService.stopRecording();
        
        // Convert speech to text
        const transcribedText = await voiceService.speechToText(audioBlob, language);
        
        if (transcribedText) {
          setSearchQuery(transcribedText);

          let searchText = transcribedText;
          if (language !== 'en') {
            try {
              const translationResponse = await apiClient.post('/voice/translate', {
                text: transcribedText,
                targetLanguage: 'en',
              }) as any;
              searchText = translationResponse.data?.text || translationResponse?.data?.data?.text || searchText;
            } catch (translateError) {
              console.error('Translation failed:', translateError);
            }
          }

          setIsProcessingVoice(false);
          await handleSearch(searchText, transcribedText);
        } else {
          setIsProcessingVoice(false);
          toast.error("Could not understand speech. Please try again.");
        }
      } else {
        // Start recording
        setIsVoiceRecording(true);
        const voiceService = (await import('@/lib/voiceService')).default;
        await voiceService.startRecording();
        toast.info("Listening... Speak the medicine name");
      }
    } catch (error: any) {
      console.error('Voice search error:', error);
      setIsVoiceRecording(false);
      setIsProcessingVoice(false);
      toast.error(error.message || "Voice search failed. Please try typing instead.");
    }
  };

  // Update the handleCameraSearch function in Home.tsx
  const handleCameraSearch = () => {
    navigate("/medicine-scanner");
  };

  const [searchResults, setSearchResults] = useState<MedicineData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const response: any = await apiClient.get(`/medicines/suggestions?query=${encodeURIComponent(searchQuery)}`);
          console.log('Suggestions response:', response);
          
          // Handle ApiResponse wrapper
          const suggestionsList = response.data?.suggestions || response.data?.data?.suggestions || [];
          console.log('Suggestions list:', suggestionsList);
          
          if (suggestionsList.length > 0) {
            setSuggestions(suggestionsList);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = async (overrideQuery?: string, originalQuery?: string) => {
    const queryInput = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!queryInput.trim()) return;
    setShowSuggestions(false);
    setSearchResults([]); // Clear previous results
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const response = await apiClient.searchMedicines({ 
        search: queryInput.trim(),
        lang: language
      }) as ApiResponse<MedicineSearchResponse>;
      
      if (response.status === 'success') {
        setSearchResults(response.data?.medicines || []);
        
        // Store search in user history
        try {
          await apiClient.post('/users/search-history', {
            query: (originalQuery ?? queryInput).trim(),
            type: 'text',
            resultCount: response.data?.medicines?.length || 0
          });
        } catch (historyError) {
          console.error('Failed to save search history:', historyError);
        }
      } else {
        toast.error('Failed to search medicines');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{t("home.greeting", { name: user?.name || 'User', defaultValue: "Hello, {{name}}!" })}</h1>
            <p className="text-white/90">{t("home.welcome", { defaultValue: "How can we help you today?" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-6 relative">
          <Input
            placeholder={t("common.search", { defaultValue: "Search medicines..." })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                setShowResults(false);
              }
            }}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow click events to fire
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className="pl-12 pr-24 py-6 bg-white/95 backdrop-blur border-0 shadow-lg text-foreground placeholder:text-muted-foreground"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          
          {/* Suggestions dropdown - only show when not showing results */}
          {showSuggestions && suggestions.length > 0 && !showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 max-h-[300px] overflow-auto">
              <div className="divide-y dark:divide-gray-700">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full text-left p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleVoiceSearch}
              disabled={isProcessingVoice}
              className={`rounded-full hover:bg-primary/10 ${
                isVoiceRecording ? 'bg-red-500/20 animate-pulse' : ''
              }`}
            >
              {isVoiceRecording ? (
                <Mic className="w-5 h-5 text-red-500" />
              ) : isProcessingVoice ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Mic className="w-5 h-5 text-primary" />
              )}
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
          
          {/* Search Results */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-30 max-h-[400px] overflow-auto">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-medium">{t("common.searchResults", { defaultValue: "Search Results" })}</h3>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShowResults(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {isSearching ? (
                <div className="flex justify-center items-center p-8">
                  <LogoLoader size="md" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((medicine) => (
                    <div 
                      key={medicine._id} 
                      className="p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/medicines/${medicine._id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Pill className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">{medicine.name}</h4>
                          {medicine.genericName && (
                            <p className="text-sm text-muted-foreground">{medicine.genericName}</p>
                          )}
                          {medicine.description && (
                            <p className="text-sm mt-1 line-clamp-2">{medicine.description}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {medicine.category}
                            </span>
                            {medicine.isPrescriptionRequired && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                Prescription
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  {t("common.noResults", { defaultValue: `No medicines found for "${searchQuery}"` })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Symptom Analyzer Banner */}
      <div className="px-4 mt-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-[var(--shadow-card)] transition-all hover-scale bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
          onClick={() => navigate("/symptoms")}
        >
          <div className="items-center flex gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{t("home.symptomAnalyzer", { defaultValue: "Custom symptom analyzer" })}</h3>
              <p className="text-sm text-muted-foreground">
                {t("home.aiAssistantDesc", { defaultValue: "Ask about medicines, symptoms, or health advice in your language" })}
              </p>
            </div>
            <Bot className="w-6 h-6 text-primary" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">{t("home.quickActions", { defaultValue: "Quick Actions" })}</h2>
        <div className="grid grid-cols-2 gap-3">
          {QuickActions({ t }).map((action, index) => {
            const Icon = action.icon;
            
            const handleActionClick = () => {
              if (action.label === t("home.symptomChecker", { defaultValue: "Symptom Checker" })) {
                navigate("/symptoms");
              } else if (action.label === t("home.myMedicines", { defaultValue: "My Medicines" })) {
                navigate("/reminders");
              } else if (action.label === t("home.healthTips", { defaultValue: "Health Tips" })) {
                healthTipsRef.current?.scrollIntoView({ behavior: "smooth" });
              } else {
                toast.info(`${action.label} coming soon!`);
              }
            };

            return (
              <Card
                key={index}
                className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:shadow-[var(--shadow-card)] transition-all hover-scale"
                onClick={handleActionClick}
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
      <div className="px-4 mt-6" ref={healthTipsRef}>
        <h2 className="text-lg font-semibold mb-4">{t("home.healthTips", { defaultValue: "Today's Health Tips" })}</h2>
        <div className="space-y-3">
          {healthTips.map((tip, index) => (
            <Card key={index} className="p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-2 h-2 rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Health Assistant</DialogTitle>
          </DialogHeader>
          <AIAssistant />
        </DialogContent>
      </Dialog>

      {/* Disclaimer Modal */}
      <DisclaimerModal
        open={showDisclaimer}
        onAgree={() => setShowDisclaimer(false)}
      />
    </div>
  );
};

export default Home;
