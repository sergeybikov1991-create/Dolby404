package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RussianAsrModelInstallerTest {
    @Test fun officialTOneArchiveIsPinnedAndUsesEightKhz() {
        assertEquals(8_000, RussianAsrModelInstaller.MODEL_SAMPLE_RATE)
        assertEquals(128_468_156L, RussianAsrModelInstaller.ARCHIVE_SIZE_BYTES)
        assertEquals(64, RussianAsrModelInstaller.ARCHIVE_SHA256.length)
        assertTrue(RussianAsrModelInstaller.DOWNLOAD_URL.endsWith(
            "sherpa-onnx-streaming-t-one-russian-2025-09-08.tar.bz2"
        ))
    }
}
