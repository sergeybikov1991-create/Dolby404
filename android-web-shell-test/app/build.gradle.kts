plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val releaseStoreFile = System.getenv("ANDROID_KEYSTORE_PATH")
val releaseStorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS")
val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")

android {
    namespace = "com.floustream.webshelltest"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.floustream.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 102
        versionName = "1.2"
        buildConfigField("String", "UPDATE_REPOSITORY", "\"sergeybikov1991-create/Dolby404\"")
        buildConfigField("String", "SUPABASE_URL", "\"https://qhpobdktlbhdqsnajypr.supabase.co\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5\"")
    }
    buildFeatures { buildConfig = true }
    signingConfigs {
        create("release") {
            if (!releaseStoreFile.isNullOrBlank()) storeFile = file(releaseStoreFile)
            storePassword = releaseStorePassword
            keyAlias = releaseKeyAlias
            keyPassword = releaseKeyPassword
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
dependencies {
    implementation("androidx.core:core-ktx:1.16.0")
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-messaging")
}

// Apply Google Services only when the matching app configuration is present.
// This keeps CI builds possible until the Release google-services.json is added.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
