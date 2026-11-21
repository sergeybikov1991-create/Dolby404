# FLOUSTREAM Android Release Signing Passport

Status: signing keystore and passwords were successfully consumed by GitHub Actions build 12 on 2026-11-21. The signed Release APK passed Gradle signing and Android APK signature verification. The APK certificate fingerprint is now also checked against the fingerprint below in the release workflow.

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

## Verification history

1. Build 12 confirmed that all four repository secrets were available to the workflow.
2. The JKS decoded successfully and `keytool` found the configured alias using the keystore password.
3. Gradle completed the signed Release build using the keystore password, alias, and private-key password.
4. `apksigner verify --verbose` accepted the generated APK signature.
5. The generated APK matched application ID `com.floustream.android`, version code `100`, and version name `1.0`.
6. The next workflow run additionally compares the APK signer certificate SHA-256 against the fingerprint above.

## Before public release

1. Run the release workflow with `publish_release` unchecked.
2. Verify the signing certificate fingerprint, APK identity, checksum, and updater manifest.
3. Add the owner-supplied FLOUSTREAM launcher artwork and verify Android adaptive icon resources.
4. Install and test on a physical Android device, including updater download, checksum verification, and system installation.
5. Publish only after explicit owner approval.

The immutable APK 2.0 baseline and website/main branch must remain untouched.
