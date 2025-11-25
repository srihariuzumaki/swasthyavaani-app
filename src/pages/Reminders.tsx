import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Pill, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import AddReminderDialog from "@/components/reminders/AddReminderDialog";

interface Reminder {
  _id: string;
  medicineName: string;
  type: string;
  dosage: string;
  times: string[];
  frequency: string;
  instruction: string;
  isActive: boolean;
  notificationIds?: number[];
  completedDoses: { date: string; time: string }[];
  snoozedUntil?: string;  // ADD THIS
  snoozeCount?: number;    // ADD THIS
}

const Reminders = () => {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchReminders();
    requestNotificationPermissions();
    initNotificationListeners();
  }, []);

  const requestNotificationPermissions = async () => {
    const { notificationService } = await import('@/lib/notificationService');
    await notificationService.requestPermissions();
  };

  const initNotificationListeners = async () => {
    const { notificationService } = await import('@/lib/notificationService');
    await notificationService.initListeners();
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ reminders: Reminder[] }>('/reminders');
      if (response.status === 'success' && response.data) {
        setReminders(response.data.reminders);

        // Reschedule all active reminders to ensure notifications are set
        const { notificationService } = await import('@/lib/notificationService');
        response.data.reminders.forEach(reminder => {
          if (reminder.isActive) {
            notificationService.scheduleReminder(reminder);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error(t("reminders.fetchFailed", { defaultValue: "Failed to load reminders" }));
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const reminderToDelete = reminders.find(r => r._id === id);
      const response = await api.delete(`/reminders/${id}`);

      if (response.status === 'success') {
        setReminders(prev => prev.filter(r => r._id !== id));

        // Cancel local notifications
        if (reminderToDelete?.notificationIds) {
          const { notificationService } = await import('@/lib/notificationService');
          await notificationService.cancelReminder(reminderToDelete.notificationIds);
        }

        toast.success(t("reminders.reminderDeleted", { defaultValue: "Reminder deleted" }));
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error(t("reminders.deleteFailed", { defaultValue: "Failed to delete reminder" }));
    }
  };

  const markAsTaken = async (reminder: Reminder, time: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.post(`/reminders/${reminder._id}/complete`, {
        date: today,
        time: time
      });

      if (response.status === 'success') {
        toast.success(t("reminders.markedTaken", { defaultValue: "Marked as taken" }));
        fetchReminders(); // Refresh to update UI
      }
    } catch (error) {
      console.error('Error marking as taken:', error);
      toast.error(t("reminders.updateFailed", { defaultValue: "Failed to update status" }));
    }
  };



  const isTakenToday = (reminder: Reminder, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    return reminder.completedDoses?.some(d =>
      new Date(d.date).toISOString().split('T')[0] === today && d.time === time
    );
  };

  // Flatten reminders into individual dose instances for display
  const getTodayDoses = () => {
    const doses: { reminder: Reminder; time: string; taken: boolean }[] = [];

    reminders.forEach(reminder => {
      if (!reminder.isActive) return;

      reminder.times.forEach(time => {
        doses.push({
          reminder,
          time,
          taken: isTakenToday(reminder, time)
        });
      });
    });

    // Sort by time
    return doses.sort((a, b) => a.time.localeCompare(b.time));
  };

  const todayDoses = getTodayDoses();
  const activeDoses = todayDoses.filter(d => !d.taken);
  const completedDoses = todayDoses.filter(d => d.taken);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent via-primary to-secondary p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">{t("reminders.title", { defaultValue: "Medication Reminders" })}</h1>
        <p className="text-white/90">{t("reminders.subtitle", { defaultValue: "Never miss your dose again" })}</p>
      </div>

      <div className="px-4 mt-6">
        {/* Add Button & Test Button */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setShowAddDialog(true)}
            size="lg"
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-medical)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("reminders.addNewReminder", { defaultValue: "Add New Reminder" })}
          </Button>

        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Reminders */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t("reminders.todaysReminders", { defaultValue: "Today's Reminders" })}
              </h2>

              {activeDoses.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">{t("reminders.noActiveReminders", { defaultValue: "No active reminders" })}</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeDoses.map((dose, index) => (
                    <Card
                      key={`${dose.reminder._id}-${dose.time}-${index}`}
                      className="p-4 animate-fade-in hover:shadow-[var(--shadow-card)] transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => markAsTaken(dose.reminder, dose.time)}
                          className="rounded-full border-primary/30 hover:bg-primary hover:text-white shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="w-4 h-4 text-primary shrink-0" />
                            <h3 className="font-semibold truncate">{dose.reminder.medicineName}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{dose.time}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {dose.reminder.dosage}
                            </Badge>
                            {dose.reminder.instruction !== 'none' && (
                              <Badge variant="outline" className="text-xs">
                                {dose.reminder.instruction.replace('_', ' ')}
                              </Badge>
                            )}
                            {dose.reminder.snoozedUntil && new Date(dose.reminder.snoozedUntil) > new Date() && (
                              <div className="flex items-center gap-1 mt-2 text-xs">
                                <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">
                                  ⏰ Snoozed
                                </Badge>
                                <span className="text-muted-foreground">
                                  Next: {new Date(dose.reminder.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (Original: {dose.time})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteReminder(dose.reminder._id)}
                          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Reminders */}
            {completedDoses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-accent" />
                  {t("reminders.completedToday", { defaultValue: "Completed Today" })}
                </h2>

                <div className="space-y-3">
                  {completedDoses.map((dose, index) => (
                    <Card
                      key={`${dose.reminder._id}-${dose.time}-${index}`}
                      className="p-4 opacity-60 animate-fade-in"
                    >
                      <div className="flex items-start gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled
                          className="rounded-full bg-accent text-white border-accent shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="w-4 h-4 shrink-0" />
                            <h3 className="font-medium line-through truncate">{dose.reminder.medicineName}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{dose.time}</span>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteReminder(dose.reminder._id)}
                          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddReminderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchReminders}
      />
    </div>
  );
};

export default Reminders;
