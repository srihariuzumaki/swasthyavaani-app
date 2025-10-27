@echo off
echo ========================================
echo Building Swasthya Vaani APK
echo ========================================
echo.

echo Step 1: Building production version...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo Sync failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building APK (this may take a few minutes)...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo APK build failed!
    echo.
    echo Possible solutions:
    echo 1. Make sure Java 17 is installed
    echo 2. Open Android Studio and build from there instead
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo SUCCESS! APK Built Successfully
echo ========================================
echo.
echo Your APK file is located at:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on your phone:
echo 1. Copy app-debug.apk to your phone
echo 2. Enable "Install from Unknown Sources" in settings
echo 3. Open the APK file and install
echo.
pause

