import { LocalNotifications } from '@capacitor/local-notifications';

const HEALTH_TIPS = [
    "💧 Drink at least 8 glasses of water daily to stay hydrated!",
    "🚶 Take a 10-minute walk after meals to aid digestion.",
    "😴 Aim for 7-8 hours of quality sleep each night.",
    "🥗 Include colorful vegetables in every meal for better nutrition.",
    "🧘 Practice deep breathing for 5 minutes to reduce stress.",
    "📱 Take regular breaks from screens to protect your eyes.",
    "🦷 Brush your teeth twice daily and floss once.",
    "☀️ Get 15 minutes of sunlight daily for vitamin D.",
    "🏃 Exercise for at least 30 minutes, 5 days a week.",
    "🍎 Eat fruits as snacks instead of processed foods.",
    "🧠 Challenge your brain with puzzles or learning new skills.",
    "💪 Stretch for 5 minutes every hour if you sit a lot.",
    "🥛 Include calcium-rich foods for strong bones.",
    "😊 Laugh often - it's great for your immune system!",
    "🍵 Limit caffeine intake, especially after 2 PM.",
    "🥤 Avoid sugary drinks and opt for water or herbal tea.",
    "🧴 Wash your hands frequently to prevent infections.",
    "🎵 Listen to calming music to reduce anxiety.",
    "📝 Keep a gratitude journal to boost mental health.",
    "🌿 Add herbs like turmeric and ginger to your diet.",
    "🏋️ Strength training twice a week keeps muscles strong.",
    "🍊 Eat vitamin C-rich foods to boost immunity.",
    "🛌 Maintain a consistent sleep schedule, even on weekends.",
    "🚭 Avoid smoking and limit alcohol consumption.",
    "🧊 Apply cold compress for headaches or muscle pain.",
    "🥜 Include nuts and seeds for healthy fats.",
    "🏊 Swimming is a great low-impact full-body workout.",
    "🌡️ Monitor your blood pressure regularly if you're over 40.",
    "🍯 Honey and warm water in the morning aids digestion.",
    "🧃 Limit processed foods and cook fresh meals at home."
];

export const healthTipsService = {
    // Get a random health tip
    getRandomTip(): string {
        return HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
    },

    // Get multiple random tips
    getRandomTips(count: number): string[] {
        const shuffled = [...HEALTH_TIPS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    // Schedule periodic health tip notifications
    async schedulePeriodicTips() {
        try {
            // Request permissions first
            const result = await LocalNotifications.requestPermissions();
            if (result.display !== 'granted') {
                console.log('Notification permission not granted');
                return;
            }

            // Create channel for health tips
            await LocalNotifications.createChannel({
                id: 'health-tips',
                name: 'Health Tips',
                description: 'Daily health tips and wellness reminders',
                importance: 3, // Medium importance
                visibility: 1,
                sound: 'default',
                vibration: true,
            });

            // Schedule 3 tips per day at different times
            const tipTimes = [
                { hour: 9, minute: 0 },   // Morning tip
                { hour: 14, minute: 30 }, // Afternoon tip
                { hour: 20, minute: 0 },  // Evening tip
            ];

            const notifications = tipTimes.map((time, index) => {
                const tip = this.getRandomTip();
                return {
                    title: '💡 Health Tip of the Day',
                    body: tip,
                    id: 9000 + index, // Unique IDs for health tips
                    schedule: {
                        on: {
                            hour: time.hour,
                            minute: time.minute,
                        },
                        allowWhileIdle: true,
                        repeats: true // Repeat daily
                    },
                    channelId: 'health-tips',
                    sound: 'default',
                };
            });

            await LocalNotifications.schedule({ notifications });
            console.log('Health tip notifications scheduled successfully');
        } catch (error) {
            console.error('Error scheduling health tips:', error);
        }
    },

    // Cancel all health tip notifications
    async cancelAllTips() {
        try {
            const tipIds = [9000, 9001, 9002].map(id => ({ id }));
            await LocalNotifications.cancel({ notifications: tipIds });
            console.log('Health tip notifications cancelled');
        } catch (error) {
            console.error('Error cancelling health tips:', error);
        }
    }
};
