import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const commonSymptoms = [
  "Headache", "Fever", "Cough", "Cold", "Body Pain", 
  "Nausea", "Dizziness", "Fatigue", "Sore Throat", "Chest Pain"
];

const Symptoms = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

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
      toast.error("Please select at least one symptom");
      return;
    }
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">Symptom Checker</h1>
        <p className="text-white/90">Select your symptoms to get medicine suggestions</p>
      </div>

      <div className="px-4 mt-6">
        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <Card className="p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">Selected Symptoms</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-xs"
              >
                Clear All
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
            <h2 className="text-lg font-semibold mb-4">Common Symptoms</h2>
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
              Check Symptoms
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
                This is for information only. Please consult a doctor for proper diagnosis.
              </p>
            </div>

            <h2 className="text-lg font-semibold mb-4">Suggested Medicines</h2>
            
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
              Check Different Symptoms
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Symptoms;
