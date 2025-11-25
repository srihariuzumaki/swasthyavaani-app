# UX Improvements Implementation Guide

## Part 1: Display Snoozed Time in Reminders UI

### Step 1: Update Reminder Interface
**File:** `src/pages/Reminders.tsx`

Find the `Reminder` interface (around line 11) and add the snooze fields:

```typescript
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
```

### Step 2: Add Snoozed Time Display
**File:** `src/pages/Reminders.tsx`

Find the active doses card (around line 203-215) and add the snoozed time display after the badges:

**FIND THIS CODE** (around line 203-215):
```tsx
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
</div>
```

**ADD THIS CODE RIGHT AFTER** (before the closing `</div>` of flex-1):
```tsx
{/* Show snoozed time if reminder is snoozed */}
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
```

---

## Part 2: Dynamic Health Tips System

### Step 1: Create Health Tips Service
**File:** `src/lib/healthTipsService.ts` (NEW FILE)

```typescript
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
```

### Step 2: Update Dashboard to Use Dynamic Tips
**File:** `src/pages/Dashboard.tsx`

**FIND** the hardcoded health tips section (around line 80-90):

```tsx
const healthTips = [
  "Stay hydrated! Drink at least 8 glasses of water daily.",
  "Regular exercise boosts immunity and mental health.",
  "Get 7-8 hours of quality sleep every night."
];
```

**REPLACE WITH**:
```tsx
import { healthTipsService } from '@/lib/healthTipsService';

// Inside the component, before return statement:
const [healthTips, setHealthTips] = useState<string[]>([]);

useEffect(() => {
  // Get 3 random tips on component mount
  setHealthTips(healthTipsService.getRandomTips(3));
  
  // Schedule periodic health tip notifications
  healthTipsService.schedulePeriodicTips();
}, []);
```

### Step 3: Initialize Health Tips in App
**File:** `src/App.tsx` or `src/main.tsx`

Add this to initialize health tips when app starts:

```typescript
import { healthTipsService } from '@/lib/healthTipsService';

// In your app initialization or useEffect:
useEffect(() => {
  // Schedule health tips on app start
  healthTipsService.schedulePeriodicTips();
}, []);
```

---

## How It Works

### Snooze Display:
- When a reminder is snoozed, it shows an orange "⏰ Snoozed" badge
- Displays "Next: [time]" showing when the notification will appear
- Shows "(Original: [time])" so users remember the original schedule
- Only appears if `snoozedUntil` is in the future

### Health Tips:
- **30 diverse health tips** covering nutrition, exercise, sleep, mental health
- **3 notifications per day**: Morning (9 AM), Afternoon (2:30 PM), Evening (8 PM)
- **Random tips** - different tip each time
- **Dashboard shows 3 random tips** that change every time the app opens
- **Like Zomato** - engaging, helpful, and periodic without being annoying

---

## Testing

### Test Snooze Display:
1. Create a reminder
2. Wait for notification
3. Tap "Snooze 10min"
4. Open Reminders page
5. You should see the orange "Snoozed" badge with next notification time

### Test Health Tips:
1. Open the app
2. Check Dashboard - should show 3 random health tips
3. Close and reopen - tips should be different
4. Wait for scheduled times (9 AM, 2:30 PM, 8 PM)
5. You should receive health tip notifications

---

## Customization

### Change Notification Times:
Edit `tipTimes` array in `healthTipsService.ts`:
```typescript
const tipTimes = [
  { hour: 8, minute: 0 },   // 8 AM
  { hour: 13, minute: 0 },  // 1 PM
  { hour: 19, minute: 30 }, // 7:30 PM
];
```

### Add More Tips:
Add to the `HEALTH_TIPS` array in `healthTipsService.ts`

### Disable Health Tips:
```typescript
await healthTipsService.cancelAllTips();
```

---

## Summary

✅ **Snooze UX**: Users now see when snoozed reminders will notify them again  
✅ **Dynamic Tips**: Health tips change every time the app opens  
✅ **Periodic Notifications**: 3 engaging health tips sent daily  
✅ **Zomato-style**: Helpful, periodic, non-intrusive notifications  

This creates a much better user experience! 🎉
