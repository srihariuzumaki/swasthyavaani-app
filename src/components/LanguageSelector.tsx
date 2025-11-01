import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Globe } from "lucide-react";
import { toast } from "sonner";

interface LanguageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LanguageSelector = ({ open, onOpenChange }: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === language) {
      onOpenChange(false);
      return;
    }

    setIsChanging(true);
    try {
      // Close dialog first to prevent UI blocking
      onOpenChange(false);
      
      // Change language - this might cause a re-render
      await changeLanguage(langCode as any);
      
      // Wait a bit for the UI to update before showing toast
      setTimeout(() => {
        toast.success(t("common.languageChanged", { defaultValue: "Language changed successfully!" }));
      }, 300);
    } catch (error) {
      console.error("Failed to change language:", error);
      toast.error(t("common.languageChangeError", { defaultValue: "Failed to change language" }));
      setIsChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t("profile.changeLanguage", { defaultValue: "Change Language" })}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-1">
            {supportedLanguages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? "secondary" : "ghost"}
                className="w-full justify-between"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelector;

