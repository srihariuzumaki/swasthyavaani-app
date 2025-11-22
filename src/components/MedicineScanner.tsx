import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Camera as CameraIcon, X, RotateCcw, Pill, Sparkles, ArrowRight, CheckCircle2, Info, AlertTriangle, Shield, Heart, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LogoLoader } from "./ui/logo-loader";
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [medicineId, setMedicineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [medicineName, setMedicineName] = useState<string>("");
  const [structuredData, setStructuredData] = useState<any>(null);
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
        // Auto-process image with OCR to extract medicine name
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
        // Auto-process image with OCR to extract medicine name
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
  useTrustedSources: true,
  medicineName: name || medicineName || undefined,
  language: i18n.language,
  scanType: 'auto'
});
      
      console.log('Medicine scan response:', response);
      
     if (response.status === 'success' && response.data?.medicine) {
  setMedicineInfo(response.data.medicine);
  setMedicineId(response.data.medicine._id || null);
  setMedicineName(""); // Clear medicine name input after successful scan
  setError(null); // Clear any previous errors
  
  // Store structured data from OCR if available
  if (response.data.structuredData) {
    setStructuredData(response.data.structuredData);
    console.log('Structured data extracted:', response.data.structuredData);
  }
        
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
  const errorMsg = (response as any).message || (response as any).data?.message || "Could not identify medicine...";
  setError(errorMsg);
  setMedicineInfo(null); // Clear medicine info
  setStructuredData(null); // Clear structured data
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
  setMedicineId(null);
  setError(null);
  setMedicineName("");
  setStructuredData(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};

  const handleViewFullDetails = () => {
    if (medicineId) {
      navigate(`/medicines/${medicineId}?scanned=true`);
    }
  };

  const handleSearchWithName = () => {
    if (imageUrl && medicineName.trim()) {
      processMedicineImage(imageUrl, medicineName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="flex flex-col h-[calc(100vh-80px)] w-full">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                  {t("medicine.scanner", { defaultValue: "Medicine Scanner" })}
                  {medicineInfo && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t("common.scanned", { defaultValue: "Scanned" })}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-white/90">{t("medicine.scannerDesc", { defaultValue: "Scan medicine packaging to get detailed information" })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
        {!imageUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative p-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 backdrop-blur-sm">
                <CameraIcon className="w-16 h-16 text-primary animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">
                {t("medicine.scanTitle", { defaultValue: "Scan Your Medicine" })}
              </p>
              <p className="text-muted-foreground max-w-sm">
                {t("medicine.scanDesc", { defaultValue: "Take a photo of your medicine packaging or prescription to get detailed information" })}
              </p>
            </div>
            <div className="flex gap-4 w-full px-2 sm:px-4">
              <Button 
                onClick={takePicture} 
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[var(--shadow-medical)] h-12 text-base font-semibold"
                size="lg"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button 
                variant="outline" 
                onClick={triggerFileInput} 
                className="flex-1 h-12 text-base font-semibold border-2 hover:bg-muted"
                size="lg"
              >
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
          <div className="flex-1 flex flex-col gap-4">
            <Card className="relative overflow-hidden border-0 border-x-0 rounded-none border-y-2 border-primary/20 shadow-lg">
              <img
                src={imageUrl}
                alt="Medicine"
                className="w-full h-48 object-contain bg-gradient-to-br from-muted/50 to-muted"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-3 right-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={resetScanner}
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
            
            {!isProcessing && !medicineInfo && !error && (
              <Card className="p-4 mx-0 bg-gradient-to-br from-muted/30 to-muted/50 border-0 border-x-0 rounded-none border-y-2 border-primary/10">
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-primary" />
                  {t("medicine.manualName", { defaultValue: "Medicine Name" })}
                  <span className="text-xs text-muted-foreground font-normal">({t("medicine.optional", { defaultValue: "Optional - OCR will auto-detect from image" })})</span>
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("medicine.manualNameDesc", { defaultValue: "If OCR couldn't detect the medicine name, enter it manually here (e.g., \"Dolo 650\", \"Crocin\")" })}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("medicine.namePlaceholder", { defaultValue: "Enter medicine name if auto-detection failed (e.g., Dolo 650)" })}
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && imageUrl) {
                        processMedicineImage(imageUrl, medicineName.trim() || undefined);
                      }
                    }}
                    className="flex-1 px-4 py-2 border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md text-sm bg-gradient-to-br from-background to-muted/30 transition-all"
                  />
                  <Button 
                    onClick={() => processMedicineImage(imageUrl!, medicineName.trim() || undefined)}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-sm font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("medicine.rescan", { defaultValue: "Rescan" })}
                  </Button>
                </div>
              </Card>
            )}

            {isProcessing && (
              <Card className="flex-1 flex flex-col items-center justify-center p-8 mx-0 bg-gradient-to-br from-primary/5 to-accent/5 border-0 border-x-0 rounded-none border-y-2 border-primary/20">
                <LogoLoader 
                  size="lg" 
                  showText 
                  text={t("medicine.processing", { defaultValue: "Processing Image..." })} 
                />
                <p className="text-sm text-muted-foreground text-center max-w-xs mt-4">
                  {t("medicine.processingDesc", { defaultValue: "Extracting text from image using OCR. This may take a few seconds." })}
                </p>
              </Card>
            )}
            
            {error && (
              <Card className="flex-1 flex flex-col items-center justify-center gap-6 p-8 mx-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 border-0 border-x-0 rounded-none border-y-2 border-red-500/20">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-destructive font-semibold text-center">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("medicine.errorDesc", { defaultValue: "You can try entering the medicine name manually" })}
                  </p>
                </div>
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t("medicine.namePlaceholder", { defaultValue: "Enter medicine name (optional)" })}
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && medicineName.trim()) {
                          handleSearchWithName();
                        }
                      }}
                      className="flex-1 px-4 py-2 border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md text-sm bg-gradient-to-br from-background to-muted/30 transition-all"
                    />
                    <Button 
                      onClick={handleSearchWithName} 
                      disabled={!medicineName.trim() || isProcessing}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-sm font-semibold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t("common.search", { defaultValue: "Search" })}
                    </Button>
                  </div>
                  <Button 
                    onClick={resetScanner} 
                    variant="outline" 
                    className="w-full border-2 font-semibold"
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("medicine.tryAgain", { defaultValue: "Try Again" })}
                  </Button>
                </div>
              </Card>
            )}
            
            {medicineInfo && (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pb-4">
                  {/* Medicine Name Card */}
                  <Card className="p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-0 border-x-0 rounded-none border-y-2 border-green-500/20 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border-2 border-green-500/20 shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {medicineInfo.name}
                        </h3>
                        {medicineInfo.genericName && (
                          <p className="text-sm text-muted-foreground font-medium">{medicineInfo.genericName}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleViewFullDetails}
                      className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 shadow-[var(--shadow-medical)] h-11 font-semibold"
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t("medicine.viewFullDetails", { defaultValue: "View Full Details" })}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Card>
                  
                  {/* Description Section */}
                  {medicineInfo.description && (
                    <Card className="p-5 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-card dark:to-purple-950/20 border-0 border-x-0 rounded-none border-y-2 border-primary/10 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 shrink-0">
                          <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-base mb-2">{t("medicine.description", { defaultValue: "Description" })}</h4>
                          <p className="text-sm leading-relaxed text-foreground">{medicineInfo.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t("medicine.disclaimer", { defaultValue: "This information is for reference purposes only. Always consult a qualified healthcare professional before making any medical decisions or starting any medication." })}
                        </p>
                      </div>
                    </Card>
                  )}
                  
                  {/* Uses Section */}
                  {medicineInfo.indications && medicineInfo.indications.length > 0 && (
                    <Card className="p-5 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-green-950/20 dark:via-card dark:to-emerald-950/20 border-0 border-x-0 rounded-none border-y-2 border-green-500/20 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 border-2 border-green-500/20">
                          <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="font-bold text-base">{t("medicine.uses", { defaultValue: "Uses" })}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {medicineInfo.indications.map((indication, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground leading-relaxed flex-1">{indication}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  
                  {/* Dosage Section */}
                  {medicineInfo.dosage && (
                    <Card className="p-5 bg-gradient-to-br from-card to-muted/30 border-0 border-x-0 rounded-none border-y-2 border-primary/10 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border-2 border-blue-500/20">
                          <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-bold text-base">{t("medicine.dosage", { defaultValue: "Dosage" })}</h4>
                      </div>
                      <div className="space-y-3">
                        {medicineInfo.dosage.adult && (
                          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-500/30 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                              <p className="font-bold text-sm text-blue-700 dark:text-blue-300">
                                {t("medicine.adults", { defaultValue: "Adults" })}
                              </p>
                            </div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium pl-4">
                              {medicineInfo.dosage.adult.min || 'As directed'} - {medicineInfo.dosage.adult.max || 'As directed'} {medicineInfo.dosage.adult.frequency ? `(${medicineInfo.dosage.adult.frequency})` : ''}
                            </p>
                          </Card>
                        )}
                        {medicineInfo.dosage.pediatric && (
                          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-500/30 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                              <p className="font-bold text-sm text-green-700 dark:text-green-300">
                                {t("medicine.children", { defaultValue: "Children" })}
                              </p>
                            </div>
                            <p className="text-sm text-green-900 dark:text-green-100 font-medium pl-4">
                              {medicineInfo.dosage.pediatric.min || 'Consult doctor'} - {medicineInfo.dosage.pediatric.max || 'Consult doctor'} {medicineInfo.dosage.pediatric.frequency ? `(${medicineInfo.dosage.pediatric.frequency})` : ''}
                            </p>
                          </Card>
                        )}
                      </div>
                    </Card>
                  )}
                  
                  {/* Side Effects Section */}
                  {medicineInfo.sideEffects && medicineInfo.sideEffects.length > 0 && (
                    <Card className="p-5 bg-gradient-to-br from-orange-50/50 via-white to-red-50/50 dark:from-orange-950/20 dark:via-card dark:to-red-950/20 border-0 border-x-0 rounded-none border-y-2 border-orange-500/20 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 border-2 border-orange-500/20">
                          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h4 className="font-bold text-base">{t("medicine.sideEffects", { defaultValue: "Side Effects" })}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {medicineInfo.sideEffects.map((effect, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <XCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground leading-relaxed flex-1">{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  
                  {/* Contraindications Section */}
                  {medicineInfo.contraindications && medicineInfo.contraindications.length > 0 && (
                    <Card className="p-5 bg-gradient-to-br from-red-50/50 via-white to-rose-50/50 dark:from-red-950/20 dark:via-card dark:to-rose-950/20 border-0 border-x-0 rounded-none border-y-2 border-red-500/20 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/20">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="font-bold text-base">{t("medicine.contraindications", { defaultValue: "Contraindications" })}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {medicineInfo.contraindications.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground leading-relaxed flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  
                  {/* Warnings Section */}
                  {medicineInfo.warnings && medicineInfo.warnings.length > 0 && (
                    <Card className="p-5 bg-gradient-to-br from-yellow-50/50 via-white to-amber-50/50 dark:from-yellow-950/20 dark:via-card dark:to-amber-950/20 border-0 border-x-0 rounded-none border-y-2 border-yellow-500/20 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 border-2 border-yellow-500/20">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h4 className="font-bold text-base">{t("medicine.warnings", { defaultValue: "Warnings" })}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {medicineInfo.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground leading-relaxed flex-1">{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  
                  {/* Prescription Required Badge */}
                  {medicineInfo.isPrescriptionRequired && (
                    <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-0 border-x-0 rounded-none border-y-2 border-yellow-500/30 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                        <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                          {t("medicine.prescriptionRequired", { defaultValue: "This medicine requires a prescription" })}
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MedicineScanner;