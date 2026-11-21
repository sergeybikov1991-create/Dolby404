# FLOUSTREAM Android Release Signing Passport

Status: generated; not yet installed in GitHub Actions secrets or used to sign a release APK.

- Application ID: `com.floustream.android`
- Release branch: `release/android-1.0`
- Key alias: `floustream-release`
- Keystore type: JKS
- Key algorithm: RSA 4096
- Signature algorithm: SHA256withRSA
- Validity: 10,000 days
- Generated: 2026-11-21
- Keystore SHA-256: `89a8c2a8bdfe0cd4b0bb53855e01d8d2ef4c9aa229f970616c360be6591665b0`
- Signing certificate SHA-256 fingerprint: `75:76:81:10:5E:9D:FA:43:B8:40:36:C6:37:81:5F:BA:0A:98:FB:61:69:DA:DF:75:E7:AE:13:65:04:A9:EE:D9`

The private keystore and passwords are intentionally not stored in this repository. They are delivered separately in the owner-only signing archive. Keep multiple secure offline backups. Never regenerate this key after the first public release; all subsequent APK updates must use the same signing identity.

Before release:
1. Add the four secrets listed in the private signing archive to GitHub Actions repository secrets.
2. Run the Android 1.0 workflow with `publish_release` unchecked.
3. Verify the signed APK and certificate fingerprint on the candidate artifact.
4. Install and test on the OnePlus 10T / Android 15.
5. Publish only after explicit owner approval.
