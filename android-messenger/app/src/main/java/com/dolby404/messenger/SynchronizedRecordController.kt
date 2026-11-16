package com.dolby404.messenger

import android.media.MediaCodec
import android.media.MediaFormat
import com.pedro.common.AudioCodec
import com.pedro.common.VideoCodec
import com.pedro.library.base.recording.RecordController
import com.pedro.library.util.AndroidMuxerRecordController
import java.io.FileDescriptor
import java.nio.ByteBuffer
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write

/**
 * RootEncoder 2.8.1 starts its async frame consumer before MediaMuxer creation
 * completes. Hold encoder frames until startRecord has fully initialized the muxer.
 */
internal class SynchronizedRecordController(
    private val delegate: RecordController = AndroidMuxerRecordController()
) : RecordController by delegate {

    private val lock = ReentrantReadWriteLock()

    override fun startRecord(path: String, listener: RecordController.Listener?, tracks: RecordController.RecordTracks) {
        lock.write { delegate.startRecord(path, listener, tracks) }
    }

    override fun startRecord(fd: FileDescriptor, listener: RecordController.Listener?, tracks: RecordController.RecordTracks) {
        lock.write { delegate.startRecord(fd, listener, tracks) }
    }

    override fun recordVideo(videoBuffer: ByteBuffer, videoInfo: MediaCodec.BufferInfo) {
        lock.read { delegate.recordVideo(videoBuffer, videoInfo) }
    }

    override fun recordAudio(audioBuffer: ByteBuffer, audioInfo: MediaCodec.BufferInfo) {
        lock.read { delegate.recordAudio(audioBuffer, audioInfo) }
    }

    override fun stopRecord() {
        lock.write { delegate.stopRecord() }
    }
}
