import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Pill, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import apiClient from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const MedicineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMedicine(id!);
        if (response.status === 'success' && response.data?.medicine) {
          setMedicine(response.data.medicine);
        } else {
          setError("Medicine not found");
        }
      } catch (err) {
        console.error("Error fetching medicine:", err);
        setError("Failed to load medicine details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedicine();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto pb-20 pt-4 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading medicine details...</p>
        <BottomNav />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="container max-w-md mx-auto pb-20 pt-4 flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Medicine Not Found</h2>
        <p className="text-muted-foreground mb-6 text-center">
          {error || "The medicine you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto pb-20 pt-4">
      <Card className="flex flex-col min-h-[80vh]">
        <div className="p-4 border-b bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Medicine Details
            </h3>
            <p className="text-sm text-white/90">Detailed information about this medicine</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">{medicine.name}</h2>
              {medicine.genericName && (
                <p className="text-lg text-muted-foreground">{medicine.genericName}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {medicine.category}
                </span>
                {medicine.isPrescriptionRequired && (
                  <span className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                    Prescription Required
                  </span>
                )}
              </div>
            </div>
            
            {medicine.description && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Description</h3>
                <p>{medicine.description}</p>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  ⚠️ This information is for reference purposes only. Always consult a qualified healthcare professional before making any medical decisions or starting any medication.
                </p>
              </div>
            )}
            
            {medicine.indications && medicine.indications.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-lg">Uses</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {medicine.indications.map((indication: string, idx: number) => (
                    <li key={idx} className="text-base">{indication}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {medicine.dosage && (
              <div>
                <h3 className="font-semibold mb-2 text-lg">Dosage</h3>
                <div className="space-y-3">
                  {medicine.dosage.adult && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Adults</p>
                      <p>{medicine.dosage.adult.min} - {medicine.dosage.adult.max} {medicine.dosage.adult.frequency}</p>
                    </div>
                  )}
                  {medicine.dosage.pediatric && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <p className="font-medium text-green-800 dark:text-green-200 mb-1">Children</p>
                      <p>{medicine.dosage.pediatric.min} - {medicine.dosage.pediatric.max} {medicine.dosage.pediatric.frequency}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {medicine.sideEffects && medicine.sideEffects.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-lg">Side Effects</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {medicine.sideEffects.map((effect: string, idx: number) => (
                    <li key={idx} className="text-base">{effect}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {medicine.contraindications && medicine.contraindications.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-lg">Contraindications</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {medicine.contraindications.map((item: string, idx: number) => (
                    <li key={idx} className="text-base">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
      <BottomNav />
    </div>
  );
};

export default MedicineDetail;