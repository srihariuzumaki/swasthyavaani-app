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
  const [medicineName, setMedicineName] = useState<string>("");
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
        // Small delay to ensure image is set before processing
        setTimeout(() => {
          processMedicineImage(image.dataUrl);
        }, 100);
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
      if (dataUrl) {
        setImageUrl(dataUrl);
        // Small delay to ensure image is set before processing
        setTimeout(() => {
          processMedicineImage(dataUrl);
        }, 100);
      } else {
        toast.error("Failed to load image. Please try again.");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processMedicineImage = async (imageData: string, name?: string) => {
    setIsProcessing(true);
    setError(null);
    setMedicineInfo(null);

    try {
      // Extract base64 data from dataUrl
      const base64Data = imageData.split(',')[1];
      
      if (!base64Data) {
        throw new Error('Failed to extract image data. Please try again.');
      }
      
      console.log('Processing medicine image...', { hasImage: !!base64Data, hasName: !!name });
      
      // Call API to process the image and get medicine info from trusted sources
      const response = await apiClient.post<MedicineScanResponse>('/medicines/scan', {
        image: base64Data,
        useTrustedSources: true, // Ensure we're using trusted sources
        medicineName: name || medicineName || undefined // Optional medicine name for better accuracy
      });
      
      console.log('Medicine scan response:', response);
      
      if (response.status === 'success' && response.data?.medicine) {
        setMedicineInfo(response.data.medicine);
        setMedicineName(""); // Clear medicine name input after successful scan
        
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
        const errorMsg = (response as any).message || (response as any).data?.message || "Could not identify medicine. Please try entering the medicine name manually below or try again with a clearer image.";
        setError(errorMsg);
        console.error('Scan failed:', response);
      }
    } catch (error: any) {
      console.error("Error processing medicine image:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while processing the image. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setImageUrl(null);
    setMedicineInfo(null);
    setError(null);
    setMedicineName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSearchWithName = () => {
    if (imageUrl && medicineName.trim()) {
      processMedicineImage(imageUrl, medicineName.trim());
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
            
            {!isProcessing && !medicineInfo && !error && (
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium">Medicine Name (Optional - improves accuracy)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter medicine name (e.g., Dolo 650)"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && imageUrl) {
                        processMedicineImage(imageUrl, medicineName.trim() || undefined);
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <Button 
                    onClick={() => processMedicineImage(imageUrl!, medicineName.trim() || undefined)}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    Scan
                  </Button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing medicine...</p>
              </div>
            )}
            
            {error && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-destructive text-center mb-2">{error}</p>
                <div className="w-full space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter medicine name (optional)"
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && medicineName.trim()) {
                          handleSearchWithName();
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button 
                      onClick={handleSearchWithName} 
                      disabled={!medicineName.trim() || isProcessing}
                      className="gap-2"
                    >
                      Search
                    </Button>
                  </div>
                </div>
                <Button onClick={resetScanner} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            )}
            
            {medicineInfo && (
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
                  
                  {medicineInfo.indications && medicineInfo.indications.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">Uses</h4>
                      <ul className="list-disc pl-5">
                        {medicineInfo.indications.map((indication, idx) => (
                          <li key={idx}>{indication}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {medicineInfo.dosage && (
                    <div>
                      <h4 className="font-semibold mb-1">Dosage</h4>
                      <div className="space-y-2">
                        {medicineInfo.dosage.adult && (
                          <div>
                            <p className="font-medium">Adults:</p>
                            <p>{medicineInfo.dosage.adult.min || 'As directed'} - {medicineInfo.dosage.adult.max || 'As directed'} {medicineInfo.dosage.adult.frequency || ''}</p>
                          </div>
                        )}
                        {medicineInfo.dosage.pediatric && (
                          <div>
                            <p className="font-medium">Children:</p>
                            <p>{medicineInfo.dosage.pediatric.min || 'Consult doctor'} - {medicineInfo.dosage.pediatric.max || 'Consult doctor'} {medicineInfo.dosage.pediatric.frequency || ''}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {medicineInfo.sideEffects && medicineInfo.sideEffects.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">Side Effects</h4>
                      <ul className="list-disc pl-5">
                        {medicineInfo.sideEffects.map((effect, idx) => (
                          <li key={idx}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {medicineInfo.warnings && medicineInfo.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">Warnings</h4>
                      <ul className="list-disc pl-5">
                        {medicineInfo.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {medicineInfo.contraindications && medicineInfo.contraindications.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">Contraindications</h4>
                      <ul className="list-disc pl-5">
                        {medicineInfo.contraindications.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {medicineInfo.isPrescriptionRequired && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        This medicine requires a prescription
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MedicineScanner;