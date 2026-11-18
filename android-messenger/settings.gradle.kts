pluginManagement {
    repositories {
        google()
        // Google-hosted Maven Central mirror reduces build failures during Maven Central rate limits (HTTP 429).
        maven { url = uri("https://maven-central.storage-download.googleapis.com/maven2/") }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        // Keep a mirror ahead of Maven Central so CI can resolve artifacts when Central is rate-limiting.
        maven { url = uri("https://maven-central.storage-download.googleapis.com/maven2/") }
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "FLOUSTREAMMessenger"
include(":app")
