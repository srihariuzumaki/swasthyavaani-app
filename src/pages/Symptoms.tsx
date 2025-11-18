import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, AlertCircle, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Symptoms = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const commonSymptoms = [
    t("symptoms.headache", { defaultValue: "Headache" }),
    t("symptoms.fever", { defaultValue: "Fever" }),
    t("symptoms.cough", { defaultValue: "Cough" }),
    t("symptoms.cold", { defaultValue: "Cold" }),
    t("symptoms.bodyPain", { defaultValue: "Body Pain" }),
    t("symptoms.nausea", { defaultValue: "Nausea" }),
    t("symptoms.dizziness", { defaultValue: "Dizziness" }),
    t("symptoms.fatigue", { defaultValue: "Fatigue" }),
    t("symptoms.soreThroat", { defaultValue: "Sore Throat" }),
    t("symptoms.chestPain", { defaultValue: "Chest Pain" }),
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const handleCheck = () => {
    if (selectedSymptoms.length === 0) {
      toast.error(t("symptoms.selectAtLeastOne", { defaultValue: "Please select at least one symptom" }));
      return;
    }
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setShowResults(false);
  };

  // Voice input handler for symptoms
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
          
          // Try to match transcribed text with common symptoms
          const matchedSymptom = commonSymptoms.find(symptom => 
            symptom.toLowerCase().includes(transcribedText.toLowerCase()) ||
            transcribedText.toLowerCase().includes(symptom.toLowerCase())
          );
          
          if (matchedSymptom && !selectedSymptoms.includes(matchedSymptom)) {
            toggleSymptom(matchedSymptom);
            toast.success(`Added: ${matchedSymptom}`);
          } else if (matchedSymptom) {
            toast.info(`${matchedSymptom} is already selected`);
          } else {
            toast.info(`Could not match "${transcribedText}" with symptoms. Please select manually.`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">{t("symptoms.title", { defaultValue: "Symptom Checker" })}</h1>
        <p className="text-white/90">{t("symptoms.subtitle", { defaultValue: "Select your symptoms to get medicine suggestions" })}</p>
      </div>

      <div className="px-4 mt-6">
        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
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
              {selectedSymptoms.map((symptom) => (
                <Badge 
                  key={symptom}
                  className="bg-primary/10 text-primary hover:bg-primary/20 pr-1"
                >
                  {symptom}
                  <button
                    onClick={() => removeSymptom(symptom)}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("symptoms.commonSymptoms", { defaultValue: "Common Symptoms" })}</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVoiceInput}
                disabled={isProcessingVoice}
                className={`${isVoiceRecording ? 'bg-red-500/20 border-red-500 animate-pulse' : ''}`}
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
            <div className="grid grid-cols-2 gap-3 mb-6">
              {commonSymptoms.map((symptom) => (
                <Button
                  key={symptom}
                  variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                  className={`h-auto py-4 ${
                    selectedSymptoms.includes(symptom)
                      ? "bg-gradient-to-r from-primary to-secondary"
                      : ""
                  }`}
                  onClick={() => toggleSymptom(symptom)}
                >
                  {symptom}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleCheck}
              size="lg"
              disabled={selectedSymptoms.length === 0}
              className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-[var(--shadow-medical)]"
            >
              {t("symptoms.checkSymptoms", { defaultValue: "Check Symptoms" })}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </>
        )}

        {/* Results */}
        {showResults && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-accent" />
              <p className="text-sm text-muted-foreground">
                {t("symptoms.disclaimer", { defaultValue: "This is for information only. Please consult a doctor for proper diagnosis." })}
              </p>
            </div>

            <h2 className="text-lg font-semibold mb-4">{t("symptoms.suggestedMedicines", { defaultValue: "Suggested Medicines" })}</h2>
            
            <div className="space-y-3 mb-6">
              {[
                { name: "Paracetamol 500mg", use: "For fever and pain relief", dose: "1 tablet every 4-6 hours" },
                { name: "Cetirizine 10mg", use: "For allergies and cold", dose: "1 tablet once daily" },
                { name: "Vitamin C", use: "Boost immunity", dose: "1 tablet daily" },
              ].map((medicine, index) => (
                <Card key={index} className="p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                  <h3 className="font-semibold text-primary mb-1">{medicine.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{medicine.use}</p>
                  <div className="text-xs text-foreground/70">
                    <span className="font-medium">Dosage:</span> {medicine.dose}
                  </div>
                </Card>
              ))}
            </div>

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
