import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, ChevronRight, AlertCircle, Mic, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";

interface Symptom {
  _id: string;
  name: string;
  category: string;
  severity: string;
  description: string;
  translations?: {
    en?: { name: string; description: string };
    hi?: { name: string; description: string };
    ta?: { name: string; description: string };
    te?: { name: string; description: string };
    bn?: { name: string; description: string };
    mr?: { name: string; description: string };
    gu?: { name: string; description: string };
    kn?: { name: string; description: string };
  };
}

interface MedicineSuggestion {
  medicine: {
    _id: string;
    name: string;
    genericName?: string;
    description?: string;
  };
  dosage: string;
  notes?: string;
}

interface SymptomCheckResult {
  symptoms: Symptom[];
  suggestions: {
    medicines: MedicineSuggestion[];
    homeRemedies: string[];
    warnings: string[];
  };
}

const Symptoms = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSymptoms, setIsCheckingSymptoms] = useState(false);
  const [results, setResults] = useState<SymptomCheckResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSymptoms, setFilteredSymptoms] = useState<Symptom[]>([]);

  // Fetch symptoms on mount
  useEffect(() => {
    fetchSymptoms();
  }, []);

  // Filter symptoms based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSymptoms(symptoms);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = symptoms.filter(symptom => {
        // Search in English name
        if (symptom.name.toLowerCase().includes(query)) return true;

        // Search in translated names
        if (symptom.translations) {
          for (const lang of Object.keys(symptom.translations)) {
            const translation = symptom.translations[lang as keyof typeof symptom.translations];
            if (translation?.name.toLowerCase().includes(query)) return true;
          }
        }

        return false;
      });
      setFilteredSymptoms(filtered);
    }
  }, [searchQuery, symptoms]);

  const fetchSymptoms = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ symptoms: Symptom[] }>('/symptoms', {
        limit: '20'
      });

      if (response.status === 'success' && response.data) {
        setSymptoms(response.data.symptoms);
        setFilteredSymptoms(response.data.symptoms);
      }
    } catch (error: any) {
      console.error('Error fetching symptoms:', error);
      toast.error('Failed to load symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const getSymptomName = (symptom: Symptom) => {
    // Return translated name if available, otherwise English name
    if (symptom.translations && symptom.translations[language as keyof typeof symptom.translations]) {
      return symptom.translations[language as keyof typeof symptom.translations]?.name || symptom.name;
    }
    return symptom.name;
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptomIds(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const removeSymptom = (symptomId: string) => {
    setSelectedSymptomIds(prev => prev.filter(id => id !== symptomId));
  };

  const handleCheck = async () => {
    if (selectedSymptomIds.length === 0) {
      toast.error(t("symptoms.selectAtLeastOne", { defaultValue: "Please select at least one symptom" }));
      return;
    }

    try {
      setIsCheckingSymptoms(true);
      const response = await api.post<SymptomCheckResult>('/symptoms/check', {
        symptoms: selectedSymptomIds,
        language: language
      });

      if (response.status === 'success' && response.data) {
        setResults(response.data);
        setShowResults(true);
      }
    } catch (error: any) {
      console.error('Error checking symptoms:', error);
      toast.error('Failed to check symptoms. Please try again.');
    } finally {
      setIsCheckingSymptoms(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptomIds([]);
    setShowResults(false);
    setResults(null);
    setSearchQuery("");
  };

  // Enhanced voice input handler with multilingual matching
  const handleVoiceInput = async () => {
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
          setIsProcessingVoice(false);

          // Try to match transcribed text with symptoms (check all language translations)
          const query = transcribedText.toLowerCase();
          const matchedSymptom = symptoms.find(symptom => {
            // Check English name
            if (symptom.name.toLowerCase().includes(query) || query.includes(symptom.name.toLowerCase())) {
              return true;
            }

            // Check all translations
            if (symptom.translations) {
              for (const lang of Object.keys(symptom.translations)) {
                const translation = symptom.translations[lang as keyof typeof symptom.translations];
                if (translation?.name.toLowerCase().includes(query) || query.includes(translation?.name.toLowerCase())) {
                  return true;
                }
              }
            }

            return false;
          });

          if (matchedSymptom && !selectedSymptomIds.includes(matchedSymptom._id)) {
            toggleSymptom(matchedSymptom._id);
            toast.success(`Added: ${getSymptomName(matchedSymptom)}`);
          } else if (matchedSymptom) {
            toast.info(`${getSymptomName(matchedSymptom)} is already selected`);
          } else {
            // No match found - use as custom symptom
            setSearchQuery(transcribedText);
            toast.success(t("symptoms.voiceCaptured", { defaultValue: "Voice input captured. You can now analyze this symptom." }));
          }
        } else {
          setIsProcessingVoice(false);
          toast.error("Could not understand speech. Please try again.");
        }
      } else {
        // Start recording
        setIsVoiceRecording(true);
        const voiceService = (await import('@/lib/voiceService')).default;
        await voiceService.startRecording();
        toast.info("Listening... Speak a symptom name");
      }
    } catch (error: any) {
      console.error('Voice input error:', error);
      setIsVoiceRecording(false);
      setIsProcessingVoice(false);
      toast.error(error.message || "Voice input failed. Please try selecting manually.");
    }
  };

  const getSelectedSymptoms = () => {
    return symptoms.filter(s => selectedSymptomIds.includes(s._id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">{t("symptoms.title", { defaultValue: "Symptom Checker" })}</h1>
        <p className="text-white/90">{t("symptoms.subtitle", { defaultValue: "Select your symptoms to get medicine suggestions" })}</p>
      </div>

      <div className="px-4 mt-6">
        {/* Selected Symptoms */}
        {selectedSymptomIds.length > 0 && (
          <Card className="p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">{t("symptoms.selectedSymptoms", { defaultValue: "Selected Symptoms" })}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                {t("symptoms.clearAll", { defaultValue: "Clear All" })}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getSelectedSymptoms().map((symptom) => (
                <Badge
                  key={symptom._id}
                  className="bg-primary/10 text-primary hover:bg-primary/20 pr-1"
                >
                  {getSymptomName(symptom)}
                  <button
                    onClick={() => removeSymptom(symptom._id)}
                    className="ml-2 hover:bg-primary/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Symptom Selection */}
        {!showResults && (
          <>
            {/* Search and Voice Input */}
            <div className="mb-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("symptoms.searchPlaceholder", { defaultValue: "Search symptoms..." })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>

              {/* Voice Input Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleVoiceInput}
                disabled={isProcessingVoice}
                className={`w-full ${isVoiceRecording ? 'bg-red-500/20 border-red-500 animate-pulse' : ''}`}
              >
                {isVoiceRecording ? (
                  <>
                    <Mic className="w-4 h-4 mr-2 text-red-500" />
                    Recording...
                  </>
                ) : isProcessingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Input
                  </>
                )}
              </Button>
            </div>

            <h2 className="text-lg font-semibold mb-4">
              {searchQuery ? `Search Results (${filteredSymptoms.length})` : t("symptoms.commonSymptoms", { defaultValue: "Common Symptoms" })}
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSymptoms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No symptoms found matching "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {filteredSymptoms.map((symptom) => (
                    <Button
                      key={symptom._id}
                      variant={selectedSymptomIds.includes(symptom._id) ? "default" : "outline"}
                      className={`h-auto py-4 text-sm ${selectedSymptomIds.includes(symptom._id)
                        ? "bg-gradient-to-r from-primary to-secondary"
                        : ""
                        }`}
                      onClick={() => toggleSymptom(symptom._id)}
                    >
                      {getSymptomName(symptom)}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleCheck}
                  size="lg"
                  disabled={selectedSymptomIds.length === 0 || isCheckingSymptoms}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-[var(--shadow-medical)]"
                >
                  {isCheckingSymptoms ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      {t("symptoms.checkSymptoms", { defaultValue: "Check Symptoms" })}
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Custom Symptom Input */}
            <div className="mt-8 pt-6 border-t border-border">
              <h2 className="text-lg font-semibold mb-2">{t("symptoms.customSymptomTitle", { defaultValue: "Have a specific symptom?" })}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {t("symptoms.customSymptomDesc", { defaultValue: "Describe your symptom in your own words and let our AI analyze it." })}
              </p>

              <div className="space-y-4">
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t("symptoms.customSymptomPlaceholder", { defaultValue: "E.g., I have a sharp pain in my stomach after eating spicy food..." })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Button
                  onClick={async () => {
                    if (!searchQuery.trim()) {
                      toast.error(t("symptoms.enterSymptom", { defaultValue: "Please describe your symptom" }));
                      return;
                    }

                    try {
                      setIsCheckingSymptoms(true);
                      const response = await api.post<any>('/symptoms/analyze', {
                        symptomText: searchQuery,
                        language: language
                      });

                      if (response.status === 'success' && response.data) {
                        // Transform AI response to match the results format
                        const aiData = response.data;
                        setResults({
                          symptoms: [{
                            _id: 'custom',
                            name: aiData.symptomName || searchQuery,
                            category: 'custom',
                            severity: 'unknown',
                            description: aiData.description || ''
                          }],
                          suggestions: {
                            medicines: aiData.suggestedMedicines.map((m: any) => ({
                              medicine: {
                                _id: 'custom',
                                name: m.name,
                                description: m.notes
                              },
                              dosage: m.dosage,
                              notes: m.notes
                            })),
                            homeRemedies: aiData.homeRemedies || [],
                            warnings: aiData.whenToSeeDoctor || []
                          }
                        });
                        setShowResults(true);
                      }
                    } catch (error) {
                      console.error('Error analyzing symptom:', error);
                      toast.error('Failed to analyze symptom. Please try again.');
                    } finally {
                      setIsCheckingSymptoms(false);
                    }
                  }}
                  disabled={!searchQuery.trim() || isCheckingSymptoms}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                >
                  {isCheckingSymptoms ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 w-5 h-5" />
                      {t("symptoms.analyzeWithAI", { defaultValue: "Analyze with AI" })}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Results */}
        {showResults && results && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-accent" />
              <p className="text-sm text-muted-foreground">
                {t("symptoms.disclaimer", { defaultValue: "This is for information only. Please consult a doctor for proper diagnosis." })}
              </p>
            </div>

            {/* Suggested Medicines */}
            {results.suggestions.medicines.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-4">{t("symptoms.suggestedMedicines", { defaultValue: "Suggested Medicines" })}</h2>

                <div className="space-y-3 mb-6">
                  {results.suggestions.medicines.map((suggestion, index) => (
                    <Card key={index} className="p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                      <h3 className="font-semibold text-primary mb-1">{suggestion.medicine.name}</h3>
                      {suggestion.medicine.genericName && (
                        <p className="text-xs text-muted-foreground mb-2">({suggestion.medicine.genericName})</p>
                      )}
                      {suggestion.medicine.description && (
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.medicine.description}</p>
                      )}
                      <div className="text-xs text-foreground/70">
                        <span className="font-medium">{t("symptoms.dosage", { defaultValue: "Dosage" })}:</span> {suggestion.dosage}
                      </div>
                      {suggestion.notes && (
                        <div className="text-xs text-amber-600 mt-1">
                          <span className="font-medium">{t("symptoms.note", { defaultValue: "Note" })}:</span> {suggestion.notes}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Home Remedies */}
            {results.suggestions.homeRemedies.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-4">{t("symptoms.homeRemedies", { defaultValue: "Home Remedies" })}</h2>
                <Card className="p-4 mb-6">
                  <ul className="space-y-2">
                    {results.suggestions.homeRemedies.map((remedy, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{remedy}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {/* Warnings */}
            {results.suggestions.warnings.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-4 text-red-600">{t("symptoms.whenToSeeDoctor", { defaultValue: "When to See a Doctor" })}</h2>
                <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
                  <ul className="space-y-2">
                    {results.suggestions.warnings.map((warning, index) => (
                      <li key={index} className="text-sm flex items-start text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {t("symptoms.checkDifferentSymptoms", { defaultValue: "Check Different Symptoms" })}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Symptoms;
