# Sharik — Android prototype

Standalone Android 8+ prototype, with Android 15 as the target compatibility level.

## Features
- Animated mascot in a transparent floating window above launcher icons and other apps.
- Autonomous horizontal walking, body bounce, and tail wag.
- Drag to reposition; the last position is saved.
- Tap to cycle between walking, sitting, and lying poses.
- Persistent notification with a Stop action.

## Permissions and limits
- Uses only Android's **Display over other apps** permission for the overlay.
- Does not request root, Accessibility, device-admin, or permission to modify launcher icon positions.
- It does not disable Android/OxygenOS restrictions.
- OnePlus battery management may stop background work. If this happens, allow background activity for the app in OxygenOS battery settings.
- This is an overlay prototype, not a true Live Wallpaper service. Live wallpapers render behind icons; this overlay can appear above them.

## Build
Open this folder as an Android Gradle project, or use the workflow at .github/workflows/sharik-android.yml.
