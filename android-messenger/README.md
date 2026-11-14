# FLOUSTREAM Messenger — Android

Native Android client for the existing FLOUSTREAM Supabase project.

## Current development stage

- Native Kotlin + Jetpack Compose application shell.
- Sign-in with the same email and password used on the FLOUSTREAM website.
- Uses the existing Supabase project and its publishable key.
- Debug APK is built by GitHub Actions; no Google Play publication is required.

The chat UI, message synchronization, chat media library, website media picker, voice/video calls, push notifications, and phone-based onboarding are planned implementation stages. They are not claimed as complete in this initial scaffold.

## Build and install a test APK

1. Open the repository's **Actions** tab.
2. Select **Build FLOUSTREAM Messenger APK**.
3. Open the latest successful run.
4. In **Artifacts**, download **FLOUSTREAM-Messenger-debug**.
5. Extract the ZIP and open `app-debug.apk` on the Android phone.
6. If Android asks, allow installation from the browser or file manager used to open the APK.

The APK is a development build, not a Google Play release. Future builds use the same application ID so Android can update the installed app without changing accounts.

## Security

Only the Supabase publishable key is included in the client. Never place a Supabase secret/service-role key or signing credentials in this repository.
