import { useState, useRef } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, Camera as CameraIcon, X, RotateCcw, Pill } from "lucide-react";
import { toast } from "sonner";
import apiClient, { MedicineScanResponse } from "@/lib/api";
import { ScrollArea } from "./ui/scroll-area";

interface MedicineInfo {
  name: string;
  genericName?: string;
  description?: string;
  indications?: string[];
  dosage?: {
    adult?: {
      min?: string;
      max?: string;
      unit?: string;
      frequency?: string;
    };
    pediatric?: {
      min?: string;
      max?: string;
      unit?: string;
      frequency?: string;
    };
  };
  sideEffects?: string[];
  contraindications?: string[];
  warnings?: string[];
  isPrescriptionRequired?: boolean;
}

const MedicineScanner = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setImageUrl(image.dataUrl);
        processMedicineImage(image.dataUrl);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast.error("Could not access camera. Please try again.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      processMedicineImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processMedicineImage = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    setMedicineInfo(null);

    try {
      // Extract base64 data from dataUrl
      const base64Data = imageData.split(',')[1];
      
      // Call API to process the image and get medicine info from trusted sources
      const response = await apiClient.post<MedicineScanResponse>('/medicines/scan', {
        image: base64Data,
        useTrustedSources: true // Ensure we're using trusted sources
      });
      
      if (response.status === 'success') {
        setMedicineInfo(response.data.medicine);
        
        // Store search in user history
        try {
          await apiClient.post('/users/search-history', {
            query: response.data.medicine.name,
            type: 'image',
            resultCount: 1,
            medicineId: response.data.medicine._id
          });
        } catch (historyError) {
          console.error('Failed to save search history:', historyError);
        }
      } else {
        setError("Could not identify medicine. Please try again with a clearer image.");
      }
    } catch (error: any) {
      console.error("Error processing medicine image:", error);
      const errorMessage = error?.message || "An error occurred while processing the image. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setImageUrl(null);
    setMedicineInfo(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="p-4 border-b bg-gradient-to-r from-primary to-secondary">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Medicine Scanner
        </h3>
        <p className="text-sm text-white/90">Scan medicine packaging to get detailed information</p>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {!imageUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="p-6 rounded-full bg-primary/10 mb-4">
              <CameraIcon className="w-12 h-12 text-primary" />
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Take a photo of your medicine packaging or prescription to get detailed information
            </p>
            <div className="flex gap-4">
              <Button onClick={takePicture} className="gap-2">
                <CameraIcon className="w-4 h-4" />
                Take Photo
              </Button>
              <Button variant="outline" onClick={triggerFileInput} className="gap-2">
                Upload Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="relative mb-4">
              <img
                src={imageUrl}
                alt="Medicine"
                className="w-full h-48 object-contain bg-muted rounded-md"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 rounded-full"
                onClick={resetScanner}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing medicine...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={resetScanner} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            ) : medicineInfo ? (
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{medicineInfo.name}</h3>
                    <p className="text-muted-foreground">{medicineInfo.genericName}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p>{medicineInfo.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Uses</h4>
                    <ul className="list-disc pl-5">
                      {medicineInfo.indications.map((indication, idx) => (
                        <li key={idx}>{indication}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Dosage</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">Adults:</p>
                        <p>{medicineInfo.dosage.adult.min} - {medicineInfo.dosage.adult.max} {medicineInfo.dosage.adult.frequency}</p>
                      </div>
                      <div>
                        <p className="font-medium">Children:</p>
                        <p>{medicineInfo.dosage.pediatric.min} - {medicineInfo.dosage.pediatric.max} {medicineInfo.dosage.pediatric.frequency}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Side Effects</h4>
                    <ul className="list-disc pl-5">
                      {medicineInfo.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Warnings</h4>
                    <ul className="list-disc pl-5">
                      {medicineInfo.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Contraindications</h4>
                    <ul className="list-disc pl-5">
                      {medicineInfo.contraindications.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {medicineInfo.isPrescriptionRequired && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        This medicine requires a prescription
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MedicineScanner;