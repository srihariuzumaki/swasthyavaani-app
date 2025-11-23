import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from "sonner";

export const notificationService = {
    async requestPermissions() {
        const result = await LocalNotifications.requestPermissions();
        if (result.display === 'granted') {
            await this.createChannel();
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
                    actionTypeId: '',
                    extra: {
                        reminderId: reminder._id,
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

    async testNotification() {
        await this.createChannel();
        const id = Math.floor(Math.random() * 1000000);
        await LocalNotifications.schedule({
            notifications: [{
                title: "Test Reminder",
                body: "This is a test notification. You should hear a voice now.",
                id: id,
                schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
                channelId: 'medication-reminders',
                sound: 'beep.wav',
                extra: {
                    medicineName: "Test Medicine",
                    dosage: "500mg",
                    instruction: "after_food"
                }
            }]
        });
        return id;
    },

    // Initialize listeners for TTS
    async initListeners() {
        await LocalNotifications.addListener('localNotificationReceived', async (notification) => {
            console.log('Notification received:', notification);
            if (notification.extra?.medicineName) {
                const text = `It's time to take ${notification.extra.medicineName}. ${notification.extra.dosage || ''}`;
                const { voiceService } = await import('./voiceService');
                // Use a slight delay to ensure audio focus
                setTimeout(() => {
                    voiceService.textToSpeech(text, 'en'); // Default to English for now, or fetch user lang
                }, 1000);
            }
        });

        await LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
            console.log('Notification action performed:', notificationAction);
            const notification = notificationAction.notification;
            if (notification.extra?.medicineName) {
                const text = `You need to take ${notification.extra.medicineName}. ${notification.extra.dosage || ''} ${notification.extra.instruction ? notification.extra.instruction.replace('_', ' ') : ''}`;
                const { voiceService } = await import('./voiceService');
                voiceService.textToSpeech(text, 'en');
            }
        });
    }
};
