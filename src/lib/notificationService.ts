import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
    async requestPermissions() {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    },

    async scheduleReminder(reminder: any) {
        if (!reminder.isActive) return;

        const notifications = [];

        // Schedule for each time
        reminder.times.forEach((time: string, index: number) => {
            const [hours, minutes] = time.split(':').map(Number);

            // Create a unique ID for each notification instance
            // Using reminder ID hash + index might be better, but for now using random IDs stored in backend
            const id = reminder.notificationIds?.[index] || Math.floor(Math.random() * 1000000);

            notifications.push({
                title: `Time for your medicine: ${reminder.medicineName}`,
                body: `Take ${reminder.dosage} ${reminder.instruction !== 'none' ? `(${reminder.instruction.replace('_', ' ')})` : ''}`,
                id: id,
                schedule: {
                    on: {
                        hour: hours,
                        minute: minutes,
                    },
                    allowWhileIdle: true,
                    every: 'day' // Default to daily for now
                },
                sound: 'beep.wav',
                attachments: [],
                actionTypeId: '',
                extra: {
                    reminderId: reminder._id
                }
            });
        });

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
        }
    },

    async cancelReminder(notificationIds: number[]) {
        if (notificationIds && notificationIds.length > 0) {
            await LocalNotifications.cancel({ notifications: notificationIds.map(id => ({ id })) });
        }
    },

    async getAllScheduled() {
        return await LocalNotifications.getPending();
    }
};
