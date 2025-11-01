# Remaining Translation Updates

## Components that still need translation updates:

### 1. Reminders.tsx - Update all hardcoded text:
- `"Medication Reminders"` → `t("reminders.title")`
- `"Never miss your dose again"` → `t("reminders.subtitle")`
- `"Add New Reminder"` → `t("reminders.addNewReminder")`
- `"Today's Reminders"` → `t("reminders.todaysReminders")`
- `"No active reminders"` → `t("reminders.noActiveReminders")`
- `"Completed Today"` → `t("reminders.completedToday")`
- `"Reminder updated"` → `t("reminders.reminderUpdated")`
- `"Reminder deleted"` → `t("reminders.reminderDeleted")`
- `"Add reminder feature coming soon!"` → `t("reminders.addReminderComingSoon")`
- `"Daily"` → `t("reminders.daily")`

### 2. BottomNav.tsx - Update navigation labels:
```tsx
import { useTranslation } from "react-i18next";

const navItems = (t: any) => [
  { icon: Home, label: t("navigation.home"), path: "/home" },
  { icon: Activity, label: t("navigation.symptoms"), path: "/symptoms" },
  { icon: Bell, label: t("navigation.reminders"), path: "/reminders" },
  { icon: User, label: t("navigation.profile"), path: "/profile" },
  { icon: HelpCircle, label: t("navigation.help"), path: "/help" },
];
```

### 3. Onboarding.tsx - Update slides:
```tsx
const slides = (t: any) => [
  {
    icon: Mic,
    title: t("onboarding.slide1Title"),
    description: t("onboarding.slide1Desc"),
    // ...
  },
  // ... other slides
];

// In component:
const { t } = useTranslation();
const slidesList = slides(t);
const slide = slidesList[currentSlide];
```

Also update:
- `"Skip"` → `t("common.skip")`
- `"Next"` → `t("common.next")`
- `"Get Started"` → `t("common.getStarted")`

### 4. Help.tsx - Update all text:
- Header titles and descriptions
- All FAQ questions and answers
- Button labels
- Help section titles

### 5. Profile.tsx - Additional fields:
Already mostly done, but check for any remaining hardcoded text:
- Personal Information section
- Accessibility settings labels

### 6. MobileOTPLogin.tsx - Login form:
All labels, placeholders, button text, and error messages need translation keys.

## Translation Files Needed:

All languages need the expanded keys:
- Hindi (hi) 
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)
- Gujarati (gu)
- Kannada (kn)

The English file has all the keys defined. You can use translation services or native speakers to translate.

