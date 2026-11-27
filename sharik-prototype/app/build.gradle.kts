import java.net.URL
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.floustream.sharik"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.floustream.sharik"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.2.0-3d"
    }
    buildFeatures {
        compose = true
    }
    buildTypes {
        debug { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" }
        release { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.10.00"))
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.ui:ui")
    implementation("io.github.sceneview:sceneview:4.18.0")
}

val generatedSharikAssets = layout.buildDirectory.dir("generated/sharikAssets")
android.sourceSets.getByName("main").assets.srcDir(generatedSharikAssets)

val downloadGermanShepherdModel by tasks.registering {
    val modelFile = generatedSharikAssets.map { it.file("german-shepherd.glb") }
    val creditsFile = generatedSharikAssets.map { it.file("THIRD_PARTY_NOTICES.txt") }
    outputs.files(modelFile, creditsFile)

    doLast {
        val model = modelFile.get().asFile
        model.parentFile.mkdirs()
        if (!model.exists() || model.length() < 1_000_000L) {
            val connection = URL("https://vinish-models.pages.dev/dogs/german-shepherd.glb")
                .openConnection().apply {
                    connectTimeout = 30_000
                    readTimeout = 90_000
                    setRequestProperty("User-Agent", "Sharik-Android-Build/0.2")
                }
            connection.getInputStream().use { input ->
                model.outputStream().use { output -> input.copyTo(output) }
            }
        }

        require(model.length() in 1_000_000L..10_000_000L) {
            "German Shepherd GLB has an unexpected size: ${model.length()} bytes"
        }
        val bytes = model.readBytes()
        require(bytes.size >= 24 && bytes.copyOfRange(0, 4).contentEquals("glTF".toByteArray())) {
            "German Shepherd asset is not a binary glTF (GLB) file"
        }
        val jsonLength = ByteBuffer.wrap(bytes, 12, 4).order(ByteOrder.LITTLE_ENDIAN).int
        require(jsonLength > 0 && 20L + jsonLength <= bytes.size) {
            "German Shepherd GLB has an invalid JSON chunk"
        }
        val gltfJson = String(bytes, 20, jsonLength, StandardCharsets.UTF_8)
        listOf("Idle", "Walk", "Trot", "Run", "Sit", "Bark").forEach { clip ->
            require(Regex("\\"name\\"\\s*:\\s*\\"$clip\\"").containsMatchIn(gltfJson)) {
                "German Shepherd GLB is missing the expected $clip animation"
            }
        }

        val credits = creditsFile.get().asFile
        credits.writeText(
            "\"German Shepherd\" by vinish.dev (https://vinish.dev/free-3d-models/), " +
                "licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). " +
                "Model is bundled for the Sharik Android prototype.\n",
            Charsets.UTF_8
        )
    }
}

tasks.named("preBuild").configure {
    dependsOn(downloadGermanShepherdModel)
}
