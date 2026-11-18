package com.dolby404.messenger.voice

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test

class VoskWakeWordModelInstallerTest {

    @Test
    fun resolvesArchiveEntriesInsideStagingDirectory() {
        val root = Files.createTempDirectory("flou-vosk-safe").toFile()
        try {
            val resolved = VoskWakeWordModelInstaller.resolveArchiveEntry(root, "model/am/final.mdl")
            assertEquals(File(root, "model/am/final.mdl").canonicalFile, resolved)
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun rejectsParentDirectoryTraversal() {
        val root = Files.createTempDirectory("flou-vosk-traversal").toFile()
        try {
            try {
                VoskWakeWordModelInstaller.resolveArchiveEntry(root, "../outside.txt")
                fail("Expected ZIP path traversal to be rejected")
            } catch (_: IllegalArgumentException) {
                // Expected: extraction must never escape the app-private staging directory.
            }
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun rejectsAbsolutePathsOutsideStagingDirectory() {
        val root = Files.createTempDirectory("flou-vosk-absolute").toFile()
        try {
            try {
                VoskWakeWordModelInstaller.resolveArchiveEntry(root, File(root.parentFile, "outside.txt").absolutePath)
                fail("Expected an absolute path outside staging to be rejected")
            } catch (_: IllegalArgumentException) {
                // Expected.
            }
        } finally {
            root.deleteRecursively()
        }
    }
}
