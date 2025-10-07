import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Pill, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface Reminder {
  id: string;
  medicine: string;
  time: string;
  frequency: string;
  completed: boolean;
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "1", medicine: "Paracetamol 500mg", time: "09:00 AM", frequency: "Daily", completed: false },
    { id: "2", medicine: "Vitamin D", time: "01:00 PM", frequency: "Daily", completed: true },
    { id: "3", medicine: "Cetirizine 10mg", time: "09:00 PM", frequency: "Daily", completed: false },
  ]);

  const toggleComplete = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
    toast.success("Reminder updated");
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    toast.success("Reminder deleted");
  };

  const addReminder = () => {
    toast.info("Add reminder feature coming soon!");
  };

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent via-primary to-secondary p-6 pt-8 rounded-b-3xl shadow-[var(--shadow-medical)]">
        <h1 className="text-2xl font-bold text-white mb-2">Medication Reminders</h1>
        <p className="text-white/90">Never miss your dose again</p>
      </div>

      <div className="px-4 mt-6">
        {/* Add Button */}
        <Button
          onClick={addReminder}
          size="lg"
          className="w-full mb-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-medical)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Reminder
        </Button>

        {/* Active Reminders */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Today's Reminders
          </h2>
          
          {activeReminders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No active reminders</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeReminders.map((reminder) => (
                <Card 
                  key={reminder.id} 
                  className="p-4 animate-fade-in hover:shadow-[var(--shadow-card)] transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => toggleComplete(reminder.id)}
                      className="rounded-full border-primary/30 hover:bg-primary hover:text-white shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-semibold truncate">{reminder.medicine}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{reminder.time}</span>
                        <Badge variant="secondary" className="ml-2">
                          {reminder.frequency}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteReminder(reminder.id)}
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
        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              Completed Today
            </h2>
            
            <div className="space-y-3">
              {completedReminders.map((reminder) => (
                <Card 
                  key={reminder.id} 
                  className="p-4 opacity-60 animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => toggleComplete(reminder.id)}
                      className="rounded-full bg-accent text-white border-accent shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 shrink-0" />
                        <h3 className="font-medium line-through truncate">{reminder.medicine}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{reminder.time}</span>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteReminder(reminder.id)}
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
      </div>
    </div>
  );
};

export default Reminders;
