import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Loader2, Plus, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";

interface AddReminderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const AddReminderDialog = ({ open, onOpenChange, onSuccess }: AddReminderDialogProps) => {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

    const [formData, setFormData] = useState({
        medicineName: "",
        type: "tablet",
        dosage: "",
        frequency: "daily",
        times: ["09:00"],
        instruction: "after_food",
        startDate: new Date().toISOString().split('T')[0],
        selectedDays: [] as string[]
    });

    const handleVoiceInput = async () => {
        try {
            if (isVoiceRecording) {
                setIsVoiceRecording(false);
                setIsProcessingVoice(true);

                const voiceService = (await import('@/lib/voiceService')).default;
                const audioBlob = await voiceService.stopRecording();
                const transcribedText = await voiceService.speechToText(audioBlob, language);

                if (transcribedText) {
                    setFormData(prev => ({ ...prev, medicineName: transcribedText }));
                    toast.success(t("reminders.voiceCaptured", { defaultValue: "Medicine name captured" }));
                } else {
                    toast.error(t("reminders.voiceFailed", { defaultValue: "Could not understand speech" }));
                }
                setIsProcessingVoice(false);
            } else {
                setIsVoiceRecording(true);
                const voiceService = (await import('@/lib/voiceService')).default;
                await voiceService.startRecording();
                toast.info(t("reminders.listening", { defaultValue: "Listening..." }));
            }
        } catch (error) {
            console.error('Voice input error:', error);
            setIsVoiceRecording(false);
            setIsProcessingVoice(false);
            toast.error("Voice input failed");
        }
    };

    const handleSubmit = async () => {
        if (!formData.medicineName) {
            toast.error(t("reminders.medicineNameRequired", { defaultValue: "Medicine name is required" }));
            return;
        }

        try {
            setLoading(true);

            // Calculate notification IDs (simple random numbers for now)
            const notificationIds = formData.times.map(() => Math.floor(Math.random() * 1000000));

            const payload = {
                ...formData,
                notificationIds
            };

            const response = await api.post<{ reminder: any }>('/reminders', payload);

            if (response.status === 'success' && response.data?.reminder) {
                // Schedule local notification
                const { notificationService } = await import('@/lib/notificationService');
                await notificationService.scheduleReminder(response.data.reminder);

                toast.success(t("reminders.createdSuccess", { defaultValue: "Reminder created successfully" }));
                onSuccess();
                onOpenChange(false);
            }

            // Reset form
            setFormData({
                medicineName: "",
                type: "tablet",
                dosage: "",
                frequency: "daily",
                times: ["09:00"],
                instruction: "after_food",
                startDate: new Date().toISOString().split('T')[0],
                selectedDays: []
            });

        } catch (error) {
            console.error('Error creating reminder:', error);
            toast.error(t("reminders.createFailed", { defaultValue: "Failed to create reminder" }));
        } finally {
            setLoading(false);
        }
    };

    const addTimeSlot = () => {
        setFormData(prev => ({ ...prev, times: [...prev.times, "09:00"] }));
    };

    const removeTimeSlot = (index: number) => {
        setFormData(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
    };

    const updateTimeSlot = (index: number, value: string) => {
        const newTimes = [...formData.times];
        newTimes[index] = value;
        setFormData(prev => ({ ...prev, times: newTimes }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("reminders.addNewReminder", { defaultValue: "Add New Reminder" })}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Medicine Name with Voice Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="medicineName">{t("reminders.medicineName", { defaultValue: "Medicine Name" })}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="medicineName"
                                value={formData.medicineName}
                                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                                placeholder="e.g., Paracetamol"
                            />
                            <Button
                                size="icon"
                                variant={isVoiceRecording ? "destructive" : "outline"}
                                onClick={handleVoiceInput}
                                disabled={isProcessingVoice}
                            >
                                {isProcessingVoice ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Mic className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Type & Dosage */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>{t("reminders.type", { defaultValue: "Type" })}</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tablet">Tablet</SelectItem>
                                    <SelectItem value="syrup">Syrup</SelectItem>
                                    <SelectItem value="injection">Injection</SelectItem>
                                    <SelectItem value="drops">Drops</SelectItem>
                                    <SelectItem value="inhaler">Inhaler</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("reminders.dosage", { defaultValue: "Dosage" })}</Label>
                            <Input
                                value={formData.dosage}
                                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                placeholder="e.g., 500mg"
                            />
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="grid gap-2">
                        <Label>{t("reminders.frequency", { defaultValue: "Frequency" })}</Label>
                        <Select
                            value={formData.frequency}
                            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="once">Once</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Times */}
                    <div className="grid gap-2">
                        <Label className="flex justify-between items-center">
                            {t("reminders.times", { defaultValue: "Times" })}
                            <Button variant="ghost" size="sm" onClick={addTimeSlot} className="h-6 px-2">
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </Label>
                        {formData.times.map((time, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {formData.times.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTimeSlot(index)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Instruction */}
                    <div className="grid gap-2">
                        <Label>{t("reminders.instruction", { defaultValue: "Instruction" })}</Label>
                        <Select
                            value={formData.instruction}
                            onValueChange={(value) => setFormData({ ...formData, instruction: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="before_food">Before Food</SelectItem>
                                <SelectItem value="after_food">After Food</SelectItem>
                                <SelectItem value="with_food">With Food</SelectItem>
                                <SelectItem value="empty_stomach">Empty Stomach</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("common.save", { defaultValue: "Save" })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddReminderDialog;
