import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Pill, 
  AlertCircle, 
  Shield, 
  AlertTriangle,
  FlaskConical,
  Heart,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoLoader } from "@/components/ui/logo-loader";
import apiClient from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";

const MedicineDetail = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [medicine, setMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        // Check if this is a scanned result from URL params
        setIsScanned(searchParams.get('scanned') === 'true');
        
        const response = await apiClient.getMedicine(id!, language);
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
  }, [id, language, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center pb-20">
        <LogoLoader size="lg" showText text={t("common.loading", { defaultValue: "Loading..." })} />
        <BottomNav />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4 pb-20">
        <Card className="w-full max-w-md p-8 text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/20">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">{t("common.error", { defaultValue: "Medicine Not Found" })}</h2>
          <p className="text-muted-foreground">
            {error || t("common.error", { defaultValue: "The medicine you're looking for doesn't exist or has been removed." })}
          </p>
          <Button 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[var(--shadow-medical)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back", { defaultValue: "Go Back" })}
          </Button>
        </Card>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm shrink-0" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  {t("medicine.details", { defaultValue: "Medicine Details" })}
                  {isScanned && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Scanned
                    </Badge>
                  )}
                </h1>
              </div>
              <p className="text-sm text-white/90">{t("medicine.detailedInfo", { defaultValue: "Detailed information about this medicine" })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6 space-y-4 animate-fade-in">
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="space-y-6 pb-4">
            {/* Medicine Name Card */}
            <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-2 border-primary/10 shadow-[var(--shadow-medical)] hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {medicine.name}
                </h2>
                {medicine.genericName && (
                  <p className="text-lg text-muted-foreground font-medium">{medicine.genericName}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {medicine.category && (
                    <Badge className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 px-3 py-1.5 text-sm font-semibold">
                      <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                      {medicine.category}
                    </Badge>
                  )}
                  {medicine.isPrescriptionRequired && (
                    <Badge className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 px-3 py-1.5 text-sm font-semibold">
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      {t("medicine.prescriptionRequired", { defaultValue: "Prescription Required" })}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Description Section */}
            {medicine.description && (
              <Card className="p-5 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-card dark:to-purple-950/20 border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-foreground">
                      {t("medicine.description", { defaultValue: "Description" })}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {medicine.description}
                    </p>
                  </div>
                </div>
                
                {/* Warning Box */}
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-500/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    {t("medicine.disclaimer", { defaultValue: "This information is for reference purposes only. Always consult a qualified healthcare professional before making any medical decisions or starting any medication." })}
                  </p>
                </div>
              </Card>
            )}

            {/* Uses Section */}
            {medicine.indications && medicine.indications.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-green-950/20 dark:via-card dark:to-emerald-950/20 border-2 border-green-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 border-2 border-green-500/20">
                    <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {t("medicine.uses", { defaultValue: "Uses" })}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {medicine.indications.map((indication: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-base leading-relaxed text-foreground flex-1">{indication}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Dosage Section */}
            {medicine.dosage && (
              <Card className="p-5 bg-gradient-to-br from-card to-muted/30 border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border-2 border-blue-500/20">
                    <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {t("medicine.dosage", { defaultValue: "Dosage" })}
                  </h3>
                </div>
                <div className="space-y-3">
                  {medicine.dosage.adult && (
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-500/30 hover:border-blue-500/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <p className="font-bold text-blue-700 dark:text-blue-300 text-base">
                          {t("medicine.adults", { defaultValue: "Adults" })}
                        </p>
                      </div>
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium pl-4">
                        {medicine.dosage.adult.min} - {medicine.dosage.adult.max} {medicine.dosage.adult.frequency}
                      </p>
                    </Card>
                  )}
                  {medicine.dosage.pediatric && (
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-500/30 hover:border-green-500/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                        <p className="font-bold text-green-700 dark:text-green-300 text-base">
                          {t("medicine.children", { defaultValue: "Children" })}
                        </p>
                      </div>
                      <p className="text-sm text-green-900 dark:text-green-100 font-medium pl-4">
                        {medicine.dosage.pediatric.min} - {medicine.dosage.pediatric.max} {medicine.dosage.pediatric.frequency}
                      </p>
                    </Card>
                  )}
                </div>
              </Card>
            )}

            {/* Side Effects Section */}
            {medicine.sideEffects && medicine.sideEffects.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-orange-50/50 via-white to-red-50/50 dark:from-orange-950/20 dark:via-card dark:to-red-950/20 border-2 border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 border-2 border-orange-500/20">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {t("medicine.sideEffects", { defaultValue: "Side Effects" })}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {medicine.sideEffects.map((effect: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-base leading-relaxed text-foreground flex-1">{effect}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Contraindications Section */}
            {medicine.contraindications && medicine.contraindications.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-red-50/50 via-white to-rose-50/50 dark:from-red-950/20 dark:via-card dark:to-rose-950/20 border-2 border-red-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/20">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {t("medicine.contraindications", { defaultValue: "Contraindications" })}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {medicine.contraindications.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-base leading-relaxed text-foreground flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Additional Warnings/Precautions if available */}
            {medicine.warnings && medicine.warnings.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-yellow-50/50 via-white to-amber-50/50 dark:from-yellow-950/20 dark:via-card dark:to-amber-950/20 border-2 border-yellow-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 border-2 border-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {t("medicine.warnings", { defaultValue: "Warnings" })}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {medicine.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-base leading-relaxed text-foreground flex-1">{warning}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      <BottomNav />
    </div>
  );
};

export default MedicineDetail;
