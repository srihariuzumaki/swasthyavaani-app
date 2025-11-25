import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from "sonner";

export const notificationService = {
  async requestPermissions() {
    const result = await LocalNotifications.requestPermissions();
    if (result.display === 'granted') {
        await this.createChannel();
        await this.registerActionTypes(); // Add this line
    }
    return result.display === 'granted';
},

    async createChannel() {
        await LocalNotifications.createChannel({
            id: 'medication-reminders',
            name: 'Medication Reminders',
            description: 'Reminders to take your medication',
            importance: 5, // High importance
            visibility: 1, // Public
            sound: 'beep.wav',
            vibration: true,
        });
    },

    async registerActionTypes() {
    await LocalNotifications.registerActionTypes({
        types: [{
            id: 'MEDICATION_ACTIONS',
            actions: [
                {
                    id: 'take',
                    title: '✓ Take Now',
                    foreground: false
                },
                {
                    id: 'snooze',
                    title: '⏰ Snooze 10min',
                    foreground: false
                },
                {
                    id: 'skip',
                    title: '✕ Skip',
                    foreground: false,
                    destructive: true
                }
            ]
        }]
    });
},

    async scheduleReminder(reminder: any) {
        // Default to true if undefined, only return if explicitly false
        if (reminder.isActive === false) return;

        try {
            // Ensure channel exists
            await this.createChannel();

            const notifications: any[] = [];

            // Schedule for each time
            reminder.times.forEach((time: string, index: number) => {
                const [hours, minutes] = time.split(':').map(Number);

                // Create a unique ID for each notification instance
                const id = reminder.notificationIds?.[index] || Math.floor(Math.random() * 1000000);

                console.log(`Scheduling reminder for ${reminder.medicineName} at ${hours}:${minutes} with ID ${id}`);

                // Calculate next occurrence for user feedback
                const now = new Date();
                const scheduledTime = new Date();
                scheduledTime.setHours(hours, minutes, 0, 0);

                let timeDesc = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (scheduledTime <= now) {
                    timeDesc += " (Tomorrow)";
                } else {
                    timeDesc += " (Today)";
                }

                notifications.push({
                    title: `Time for your medicine: ${reminder.medicineName}`,
                    body: `Take ${reminder.dosage} ${reminder.instruction !== 'none' ? `(${reminder.instruction.replace('_', ' ')})` : ''}`,
                    id: id,
                    schedule: {
                        on: {
                            hour: hours,
                            minute: minutes,
                        },
                        allowWhileIdle: true
                    },
                    channelId: 'medication-reminders',
                    sound: 'beep.wav',
                    attachments: [],
                    actionTypeId: 'MEDICATION_ACTIONS',
                    extra: {
                        reminderId: reminder._id,
                        time: time,
                        medicineName: reminder.medicineName,
                        dosage: reminder.dosage,
                        instruction: reminder.instruction
                    }
                });

                // Show toast for the first time slot as confirmation
                if (index === 0) {
                    toast.success(`Scheduled for ${timeDesc}`);
                }
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log('Notifications scheduled successfully');
            }
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            toast.error("Failed to schedule notification");
        }
    },

    async cancelReminder(notificationIds: number[]) {
        if (notificationIds && notificationIds.length > 0) {
            await LocalNotifications.cancel({ notifications: notificationIds.map(id => ({ id })) });
        }
    },

    async getAllScheduled() {
        return await LocalNotifications.getPending();
    },

    // Initialize listeners for TTS
    async initListeners() {
       await LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
    console.log('Notification action performed:', notificationAction);
    const { actionId, notification } = notificationAction;
    const { reminderId, time } = notification.extra;
    try {
        const api = (await import('./api')).default;
        switch (actionId) {
            case 'take':
                // Mark as taken
                await api.post(`/reminders/${reminderId}/quick-complete`, { time });
                toast.success('Marked as taken!');
                break;
            case 'snooze':
                // Snooze for 10 minutes
                await api.post(`/reminders/${reminderId}/snooze`, { 
                    duration: 10,
                    time 
                });
                toast.success('Snoozed for 10 minutes');
                
                // Reschedule notification for 10 minutes later
                const snoozedTime = new Date();
                snoozedTime.setMinutes(snoozedTime.getMinutes() + 10);
                
                await LocalNotifications.schedule({
                    notifications: [{
                        title: notification.title,
                        body: notification.body + ' (Snoozed)',
                        id: Math.floor(Math.random() * 1000000),
                        schedule: { at: snoozedTime },
                        channelId: 'medication-reminders',
                        actionTypeId: 'MEDICATION_ACTIONS',
                        extra: notification.extra
                    }]
                });
                break;
            case 'skip':
                // Just dismiss, no action needed
                console.log('Reminder skipped');
                break;
        }
    } catch (error) {
        console.error('Error handling notification action:', error);
        toast.error('Failed to process action');
    }
});

    
    }
};
