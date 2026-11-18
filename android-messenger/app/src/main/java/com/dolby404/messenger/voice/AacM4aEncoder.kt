package com.dolby404.messenger.voice

import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import java.nio.ByteBuffer

/**
 * Isolated incremental PCM16 -> AAC-LC/M4A encoder.
 * Does not open a microphone, own an audio lease, upload files, or alter the
 * production MediaRecorder path. Feed frames from the future shared capture loop.
 */
class AacM4aEncoder(
    private val outputFile: File,
    private val sampleRateHz: Int = 44_100,
    private val channelCount: Int = 1,
    private val bitRate: Int = 96_000
) : AutoCloseable {
    companion object {
        private const val MIME = MediaFormat.MIMETYPE_AUDIO_AAC
        private const val TIMEOUT_US = 10_000L
    }

    private var codec: MediaCodec? = null
    private var muxer: MediaMuxer? = null
    private var trackIndex = -1
    private var muxerStarted = false
    private var started = false
    private var finished = false
    private var submittedSamples = 0L

    init {
        require(sampleRateHz > 0)
        require(channelCount in 1..2)
        require(bitRate > 0)
    }

    @Synchronized
    fun start() {
        check(!started && !finished) { "Encoder can only be started once" }
        require(outputFile.parentFile?.exists() == true) { "Output directory does not exist" }
        try {
            val format = MediaFormat.createAudioFormat(MIME, sampleRateHz, channelCount).apply {
                setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
                setInteger(MediaFormat.KEY_BIT_RATE, bitRate)
                setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16 * 1024)
                setInteger(MediaFormat.KEY_PCM_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
            }
            codec = MediaCodec.createEncoderByType(MIME).also {
                it.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
                it.start()
            }
            muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            started = true
        } catch (error: Exception) {
            releaseResources()
            throw error
        }
    }

    /** length is a count of interleaved Short samples, not bytes. */
    @Synchronized
    fun writePcm(samples: ShortArray, length: Int = samples.size) {
        check(started && !finished)
        require(length in 1..samples.size && length % channelCount == 0)
        val activeCodec = checkNotNull(codec)
        var offset = 0
        while (offset < length) {
            val inputIndex = activeCodec.dequeueInputBuffer(TIMEOUT_US)
            if (inputIndex < 0) {
                drainOutput()
                continue
            }
            val input = checkNotNull(activeCodec.getInputBuffer(inputIndex))
            input.clear()
            val capacitySamples = input.remaining() / 2
            val count = minOf(length - offset, capacitySamples - capacitySamples % channelCount)
            check(count > 0) { "AAC input buffer is too small" }
            repeat(count) { i ->
                val value = samples[offset + i].toInt()
                input.put((value and 0xff).toByte())
                input.put(((value ushr 8) and 0xff).toByte())
            }
            val pts = submittedSamples * 1_000_000L /
                (sampleRateHz.toLong() * channelCount)
            activeCodec.queueInputBuffer(inputIndex, 0, count * 2, pts, 0)
            submittedSamples += count
            offset += count
            drainOutput()
        }
    }

    @Synchronized
    fun finish() {
        if (finished) return
        check(started)
        try {
            val activeCodec = checkNotNull(codec)
            var queued = false
            while (!queued) {
                val inputIndex = activeCodec.dequeueInputBuffer(TIMEOUT_US)
                if (inputIndex >= 0) {
                    val pts = submittedSamples * 1_000_000L /
                        (sampleRateHz.toLong() * channelCount)
                    activeCodec.queueInputBuffer(
                        inputIndex, 0, 0, pts, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                    )
                    queued = true
                } else drainOutput()
            }
            while (!drainOutput(waitForEos = true)) Unit
            finished = true
        } finally {
            releaseResources()
        }
    }

    private fun drainOutput(waitForEos: Boolean = false): Boolean {
        val activeCodec = checkNotNull(codec)
        val info = MediaCodec.BufferInfo()
        while (true) {
            when (val index = activeCodec.dequeueOutputBuffer(
                info, if (waitForEos) TIMEOUT_US else 0L
            )) {
                MediaCodec.INFO_TRY_AGAIN_LATER -> return false
                MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    check(!muxerStarted) { "Unexpected second AAC output format" }
                    val activeMuxer = checkNotNull(muxer)
                    trackIndex = activeMuxer.addTrack(activeCodec.outputFormat)
                    activeMuxer.start()
                    muxerStarted = true
                }
                MediaCodec.INFO_OUTPUT_BUFFERS_CHANGED -> Unit
                else -> if (index >= 0) {
                    val data: ByteBuffer? = activeCodec.getOutputBuffer(index)
                    if (info.size > 0 && info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
                        check(muxerStarted) { "AAC data arrived before output format" }
                        val buffer = checkNotNull(data)
                        buffer.position(info.offset)
                        buffer.limit(info.offset + info.size)
                        checkNotNull(muxer).writeSampleData(trackIndex, buffer, info)
                    }
                    val eos = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
                    activeCodec.releaseOutputBuffer(index, false)
                    if (eos) return true
                }
            }
        }
    }

    @Synchronized
    override fun close() {
        if (started && !finished) finish() else releaseResources()
    }

    private fun releaseResources() {
        runCatching { codec?.stop() }
        runCatching { codec?.release() }
        codec = null
        if (muxerStarted) runCatching { muxer?.stop() }
        runCatching { muxer?.release() }
        muxer = null
        muxerStarted = false
        started = false
    }
}
