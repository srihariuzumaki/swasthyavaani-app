import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Bell, Globe, Moon, Type, Contrast, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";

const Profile = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const { language, supportedLanguages } = useLanguage();
  const navigate = useNavigate();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const currentLanguage = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

  const handleLogout = () => {
    logout();
    // Clear onboarding state so user goes through onboarding again
    localStorage.removeItem("hasSeenOnboarding");
    toast.success(t("common.loggedOut", { defaultValue: "Logged out successfully!" }));
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{t("profile.title", { defaultValue: "Profile" })}</h1>
          <p className="text-white/90">{t("profile.managePreferences", { defaultValue: "Manage your preferences" })}</p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Profile Info */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </h2>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toast.info("Edit profile coming soon!")}
            >
              <span>Name</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toast.info("Edit email coming soon!")}
            >
              <span>Email</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toast.info("Edit phone coming soon!")}
            >
              <span>Phone Number</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t("profile.notifications", { defaultValue: "Notifications" })}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("profile.medicationReminders", { defaultValue: "Medication Reminders" })}</p>
                <p className="text-sm text-muted-foreground">{t("profile.getNotified", { defaultValue: "Get notified for your doses" })}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("profile.healthTips", { defaultValue: "Health Tips" })}</p>
                <p className="text-sm text-muted-foreground">{t("profile.dailyAdvice", { defaultValue: "Daily wellness advice" })}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Language */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("profile.language", { defaultValue: "Language" })}
          </h2>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowLanguageSelector(true)}
          >
            <span>{currentLanguage.nativeName}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {t("profile.supports", { defaultValue: "Supports: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada" })}
          </p>
        </Card>

        {/* Accessibility */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Accessibility Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Easier on the eyes</p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">Large Text</p>
                  <p className="text-sm text-muted-foreground">Increase font size</p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Better visibility</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          {t("common.logOut", { defaultValue: "Log Out" })}
        </Button>
      </div>

      <LanguageSelector open={showLanguageSelector} onOpenChange={setShowLanguageSelector} />
    </div>
  );
};

export default Profile;
