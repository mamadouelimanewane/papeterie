@echo off
echo Building APK locally (Free mode)...
npx eas-cli build --platform android --profile preview --local --non-interactive

