# Building APK for Swasthya Vaani App

## Prerequisites
- Java 17 or higher (install from https://adoptium.net/temurin/releases/?version=17)
- Node.js and npm installed
- Android SDK (comes with Android Studio or standalone)

## Steps to Build APK

### 1. Install Java 17
Download and install Java 17 from: https://adoptium.net/temurin/releases/?version=17
- Choose "Windows x64" version
- After installation, set JAVA_HOME environment variable to Java 17 installation path

### 2. Set Java 17 as Default (Optional but Recommended)
Add to your `android/gradle.properties` file:
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.x-hotspot
```
(Update the path to match your actual Java 17 installation)

### 3. Build the APK

#### Option A: Using Command Line
```bash
# Navigate to project root
cd E:\Projects\swasthyavaani-app

# Build the app
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK
cd android
.\gradlew assembleDebug

# Your APK will be in: android\app\build\outputs\apk\debug\app-debug.apk
```

#### Option B: Using Android Studio (Easier)
1. Install Android Studio if not already installed
2. Open Android Studio
3. Click "Open an Existing Project"
4. Navigate to and select the `android` folder in your project
5. Wait for Gradle sync to complete
6. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
7. After build completes, click "locate" to find your APK
8. The APK will be in: `android\app\build\outputs\apk\debug\app-debug.apk`

### 4. Install on Your Phone
1. Transfer the `app-debug.apk` file to your Android phone
2. Enable "Install from Unknown Sources" in phone settings
3. Open the APK file on your phone
4. Tap Install
5. Done! Your app is now installed

### 5. For HOD/Client Demonstration
- The app connects to: `https://swasthyavaani-app.vercel.app/api`
- No local server needed
- Works completely offline for cached data
- All medicine searches work through the deployed backend

## Notes
- The app will automatically use the production backend URL
- You can demo it to anyone without your computer running
- The APK is signed with debug key (for development only)
- For production release, you'll need to generate a release key

## Troubleshooting

### Issue: "Android Gradle plugin requires Java 17"
**Solution:** Install Java 17 and update `gradle.properties` as shown above

### Issue: "SDK location not found"
**Solution:** Install Android SDK through Android Studio

### Issue: Build fails with memory error
**Solution:** Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### Issue: "Command 'gradlew' not found"
**Solution:** Use Android Studio to build instead, or run:
```bash
cd android
.\gradlew.bat assembleDebug
```

