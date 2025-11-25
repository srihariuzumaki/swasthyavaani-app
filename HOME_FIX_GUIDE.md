# Quick Fix for Home.tsx - Dynamic Health Tips

The file got corrupted. Here's the exact code to add in the correct places:

## Step 1: Add Import (Line 14, after other imports)

**FIND THIS LINE:**
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
```

**ADD THIS LINE RIGHT AFTER IT:**
```typescript
import { healthTipsService } from '@/lib/healthTipsService';
```

---

## Step 2: Remove Old HealthTips Function (Lines 25-30)

**DELETE THESE LINES:**
```typescript
const HealthTips = ({ t }: { t: any }) => [
  t("home.healthTip1", { defaultValue: "Drink 8 glasses of water daily" }),
  t("home.healthTip2", { defaultValue: "Take medicines after meals unless prescribed otherwise" }),
  t("home.healthTip3", { defaultValue: "Exercise for 30 minutes daily" }),
  t("home.healthTip4", { defaultValue: "Get 7-8 hours of sleep" }),
];
```

---

## Step 3: Add State and useEffect (After line 38, inside Home component)

**FIND THIS:**
```typescript
const Home = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
```

**ADD THIS RIGHT AFTER (before the first useEffect):**
```typescript
  const [healthTips, setHealthTips] = useState<string[]>([]);

  useEffect(() => {
    // Get 3 random tips on component mount
    setHealthTips(healthTipsService.getRandomTips(3));
    
    // Schedule periodic health tip notifications
    healthTipsService.schedulePeriodicTips();
  }, []);
```

---

## Step 4: Fix Translation Response (Line 73-77)

**FIND:**
```typescript
              const translationResponse = await apiClient.post('/voice/translate', {
                text: transcribedText,
                targetLanguage: 'en',
              });
```

**CHANGE TO:**
```typescript
              const translationResponse = await apiClient.post('/voice/translate', {
                text: transcribedText,
                targetLanguage: 'en',
              }) as any;
```

---

## Step 5: Use Dynamic Health Tips (Line 405)

**FIND:**
```typescript
          {HealthTips({ t }).map((tip, index) => (
```

**CHANGE TO:**
```typescript
          {healthTips.map((tip, index) => (
```

---

## That's It!

After these 5 changes:
- ✅ Health tips will be dynamic and change on every app open
- ✅ Periodic notifications will be scheduled (9 AM, 2:30 PM, 8 PM)
- ✅ No more TypeScript errors
- ✅ Snooze display already working in Reminders

**Important:** Make sure you don't duplicate any code. Each change should be made only once in the correct location.
