plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.floustream.webshelltest"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.floustream.webshelltest"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "SUPABASE_URL", "\"https://qhpobdktlbhdqsnajypr.supabase.co\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5\"")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = false
        }
    }
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-messaging")
}

// Keep CI builds possible before the Firebase Console config is supplied.
// Once app/google-services.json is added for com.floustream.webshelltest,
// the official plugin generates Firebase resources automatically.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
