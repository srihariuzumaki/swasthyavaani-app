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

    // Initialize listeners for TTS
    async initListeners() {
        await LocalNotifications.addListener('localNotificationReceived', async (notification) => {
            console.log('Notification received:', notification);
            try {
                if (notification.extra?.medicineName) {
                    const { voiceService } = await import('./voiceService');
                    const config = await import('../i18n/config');
                    const resources = config.resources;

                    // Get language from localStorage
                    const lang = localStorage.getItem('app_language') || 'en';
                    console.log('TTS Language:', lang);

                    let text = '';
                    try {
                        // Manual translation lookup
                        // @ts-ignore
                        const translation = resources?.[lang]?.translation?.reminders?.ttsMessage || resources?.['en']?.translation?.reminders?.ttsMessage;

                        if (translation) {
                            const instruction = notification.extra.instruction ? notification.extra.instruction.replace('_', ' ') : '';
                            text = translation
                                .replace('{{medicineName}}', notification.extra.medicineName)
                                .replace('{{dosage}}', notification.extra.dosage || '')
                                .replace('{{instruction}}', instruction);
                        }
                    } catch (err) {
                        console.error('Translation lookup failed:', err);
                    }

                    // Fallback if translation failed
                    if (!text) {
                        const instruction = notification.extra.instruction ? notification.extra.instruction.replace('_', ' ') : '';
                        text = `Time to take ${notification.extra.medicineName}. ${notification.extra.dosage || ''} ${instruction}`;
                    }

                    console.log('TTS Text (Final):', text);

                    // Use a slight delay to ensure audio focus
                    setTimeout(() => {
                        voiceService.textToSpeech(text, lang);
                    }, 1000);
                }
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        });

        await LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
            console.log('Notification action performed:', notificationAction);
            try {
                const notification = notificationAction.notification;
                if (notification.extra?.medicineName) {
                    const { voiceService } = await import('./voiceService');
                    const config = await import('../i18n/config');
                    const resources = config.resources;

                    // Get language from localStorage
                    const lang = localStorage.getItem('app_language') || 'en';
                    console.log('TTS Language (Action):', lang);

                    let text = '';
                    try {
                        // Manual translation lookup
                        // @ts-ignore
                        const translation = resources?.[lang]?.translation?.reminders?.ttsMessage || resources?.['en']?.translation?.reminders?.ttsMessage;

                        if (translation) {
                            const instruction = notification.extra.instruction ? notification.extra.instruction.replace('_', ' ') : '';
                            text = translation
                                .replace('{{medicineName}}', notification.extra.medicineName)
                                .replace('{{dosage}}', notification.extra.dosage || '')
                                .replace('{{instruction}}', instruction);
                        }
                    } catch (err) {
                        console.error('Translation lookup failed:', err);
                    }

                    // Fallback if translation failed
                    if (!text) {
                        const instruction = notification.extra.instruction ? notification.extra.instruction.replace('_', ' ') : '';
                        text = `Time to take ${notification.extra.medicineName}. ${notification.extra.dosage || ''} ${instruction}`;
                    }

                    console.log('TTS Text (Action Final):', text);

                    voiceService.textToSpeech(text, lang);
                }
            } catch (error) {
                console.error('Error in notification action listener:', error);
            }
        });
    }
};
