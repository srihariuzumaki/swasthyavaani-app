# Manual Steps: Add Snooze & Quick-Complete Endpoints

## Step 1: Open the file
Open `backend/src/routes/reminders.js`

## Step 2: Find the location
Scroll to the **bottom** of the file and find this line:
```javascript
export default router;
```

## Step 3: Add the new endpoints
**BEFORE** the `export default router;` line, add the following code:

```javascript
// @route   POST /api/reminders/:id/snooze
// @desc    Snooze a reminder
// @access  Private
router.post('/:id/snooze', [
    body('duration')
        .isInt({ min: 1, max: 120 })
        .withMessage('Duration must be between 1 and 120 minutes'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
], validateRequest, async (req, res, next) => {
    try {
        const { duration, time } = req.body;

        // Calculate snooze until time
        const snoozedUntil = new Date();
        snoozedUntil.setMinutes(snoozedUntil.getMinutes() + duration);

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $set: {
                    snoozedUntil,
                    lastInteraction: new Date()
                },
                $inc: { snoozeCount: 1 }
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: `Reminder snoozed for ${duration} minutes`,
            data: { reminder, snoozedUntil },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/reminders/:id/quick-complete
// @desc    Quick complete from notification action
// @access  Private
router.post('/:id/quick-complete', [
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time format (HH:MM)'),
], validateRequest, async (req, res, next) => {
    try {
        const { time } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $push: {
                    completedDoses: {
                        date: new Date(today),
                        time,
                        completedAt: new Date()
                    },
                },
                $set: {
                    lastInteraction: new Date(),
                    snoozedUntil: null // Clear snooze if any
                }
            },
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found',
            });
        }

        res.json({
            status: 'success',
            message: 'Dose marked as taken',
            data: { reminder },
        });
    } catch (error) {
        next(error);
    }
});

```

## Step 4: Verify
After adding, the end of your file should look like:
```javascript
    }
});

// @route   POST /api/reminders/:id/snooze
// ... (the code you just added)

// @route   POST /api/reminders/:id/quick-complete
// ... (the code you just added)

export default router;
```

## Step 5: Save the file
Save `backend/src/routes/reminders.js`

## Done! ✅
The backend now has:
- ✅ Reminder model with snooze fields (already done)
- ✅ `/api/reminders/:id/snooze` endpoint (you just added)
- ✅ `/api/reminders/:id/quick-complete` endpoint (you just added)

Next, I'll update the frontend notification service to use these endpoints!
