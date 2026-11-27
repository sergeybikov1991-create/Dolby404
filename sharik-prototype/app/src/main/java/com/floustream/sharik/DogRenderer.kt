package com.floustream.sharik

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import kotlin.math.cos
import kotlin.math.sin

/**
 * Detailed side-view German Shepherd renderer.
 *
 * Kept separate from the overlay service so the desktop/permission/drag logic
 * remains independent from the character artwork and animation.
 */
internal class DogRenderer {
    private val coat = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        shader = LinearGradient(42f, 48f, 138f, 126f,
            intArrayOf(0xFFFFD18A.toInt(), 0xFFB96B32.toInt(), 0xFF71391F.toInt()),
            null, Shader.TileMode.CLAMP)
    }
    private val darkCoat = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        shader = LinearGradient(55f, 43f, 125f, 91f,
            intArrayOf(0xFF292522.toInt(), 0xFF101316.toInt(), 0xFF3C2B24.toInt()),
            null, Shader.TileMode.CLAMP)
    }
    private val black = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF17191B.toInt() }
    private val warm = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFD18A4C.toInt() }
    private val lightFur = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFE7AD6C.toInt() }
    private val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x44302A28 }
    private val detail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF4A2B20.toInt()
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeWidth = 1.5f
    }
    private val legPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val eye = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF151313.toInt() }
    private val shine = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFE5C2.toInt() }
    private val tongue = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFDA6471.toInt() }
    private val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val path = Path()
    private val bodyRect = RectF()
    private val pawRect = RectF()

    fun draw(canvas: Canvas, width: Float, height: Float, pose: Int, frame: Int) {
        val sx = width / 184f
        val sy = height / 184f
        canvas.save()
        canvas.scale(sx, sy)

        val walking = pose == 0
        val sleeping = pose == 1
        val sitting = pose == 2
        val phase = frame * 0.22f
        val stride = if (walking) sin(phase) else 0f
        val bob = if (walking) sin(phase * 2f) * 1.7f else 0f
        val breath = if (sleeping) sin(frame * 0.045f) * 1.3f else sin(frame * 0.075f) * 0.8f
        val baseY = if (sleeping) 111f else if (sitting) 117f else 116f

        // Ground contact shadow.
        canvas.drawOval(25f, 137f, 164f, 151f, shadow)

        // Tail: long, bushy and attached to the rump, not a thin cartoon cord.
        canvas.save()
        val tailWag = if (walking) sin(phase * 0.8f) * 11f else sin(frame * 0.07f) * 5f
        canvas.rotate(tailWag, 49f, 78f)
        path.reset()
        path.moveTo(51f, 80f)
        path.cubicTo(32f, 72f, 18f, 51f, 10f, 53f)
        path.cubicTo(5f, 56f, 15f, 77f, 31f, 91f)
        path.cubicTo(39f, 98f, 48f, 96f, 57f, 91f)
        path.close()
        canvas.drawPath(path, darkCoat)
        path.reset()
        path.moveTo(43f, 84f)
        path.cubicTo(28f, 75f, 22f, 62f, 14f, 58f)
        path.cubicTo(22f, 78f, 34f, 91f, 49f, 94f)
        path.close()
        canvas.drawPath(path, coat)
        canvas.restore()

        // Far-side legs first, with articulated joints and paw contact.
        if (sleeping) {
            drawRestingLeg(canvas, 65f, 103f, 24f, false)
            drawRestingLeg(canvas, 119f, 105f, 27f, false)
        } else if (sitting) {
            drawLeg(canvas, 68f, 102f, -0.45f, true, true)
            drawLeg(canvas, 122f, 104f, 0.05f, false, true)
        } else {
            drawLeg(canvas, 72f, 105f, -stride, true, false)
            drawLeg(canvas, 116f, 107f, stride, false, false)
        }

        // Main torso: deep chest, long back and tucked waist.
        val bodyBob = bob + breath
        path.reset()
        path.moveTo(43f, 78f + bodyBob)
        path.cubicTo(48f, 59f + bodyBob, 65f, 49f + bodyBob, 88f, 52f + bodyBob)
        path.cubicTo(108f, 48f + bodyBob, 126f, 58f + bodyBob, 135f, 76f + bodyBob)
        path.cubicTo(139f, 91f + bodyBob, 128f, 111f + bodyBob, 111f, 116f + bodyBob)
        path.cubicTo(91f, 122f + bodyBob, 65f, 116f + bodyBob, 48f, 105f + bodyBob)
        path.cubicTo(39f, 98f + bodyBob, 38f, 88f + bodyBob, 43f, 78f + bodyBob)
        path.close()
        canvas.drawPath(path, coat)

        // Black saddle and shoulder mantle, following the real breed pattern.
        path.reset()
        path.moveTo(48f, 75f + bodyBob)
        path.cubicTo(60f, 53f + bodyBob, 82f, 48f + bodyBob, 104f, 55f + bodyBob)
        path.cubicTo(119f, 58f + bodyBob, 128f, 68f + bodyBob, 132f, 82f + bodyBob)
        path.cubicTo(119f, 88f + bodyBob, 106f, 88f + bodyBob, 94f, 82f + bodyBob)
        path.cubicTo(77f, 78f + bodyBob, 63f, 88f + bodyBob, 46f, 94f + bodyBob)
        path.cubicTo(43f, 88f + bodyBob, 44f, 81f + bodyBob, 48f, 75f + bodyBob)
        path.close()
        canvas.drawPath(path, darkCoat)

        // Warm chest and neck ruff.
        path.reset()
        path.moveTo(119f, 65f + bodyBob)
        path.cubicTo(135f, 70f + bodyBob, 143f, 88f + bodyBob, 132f, 112f + bodyBob)
        path.cubicTo(124f, 119f + bodyBob, 113f, 111f + bodyBob, 111f, 99f + bodyBob)
        path.cubicTo(113f, 85f + bodyBob, 109f, 75f + bodyBob, 119f, 65f + bodyBob)
        path.close()
        canvas.drawPath(path, lightFur)

        // Shoulder fur highlights and subtle coat texture.
        line.color = 0x66FFE0B0
        line.strokeWidth = 1.3f
        for (i in 0..5) {
            val x = 59f + i * 9f
            canvas.drawLine(x, 67f + bodyBob, x - 4f, 78f + bodyBob, line)
        }
        line.color = 0x66331C16
        line.strokeWidth = 1f
        for (i in 0..4) {
            val x = 72f + i * 10f
            canvas.drawLine(x, 99f + bodyBob, x + 3f, 108f + bodyBob, line)
        }

        // Near-side legs.
        if (sleeping) {
            drawRestingLeg(canvas, 70f, 108f, 27f, true)
            drawRestingLeg(canvas, 121f, 108f, 31f, true)
        } else if (sitting) {
            drawLeg(canvas, 77f, 107f, 0.55f, true, false)
            drawLeg(canvas, 128f, 106f, -0.12f, false, false)
        } else {
            drawLeg(canvas, 78f, 108f, stride, true, true)
            drawLeg(canvas, 124f, 109f, -stride, false, true)
        }

        // Head and neck angle change slightly while sitting.
        val headLift = if (sitting) -5f else if (sleeping) 7f else 0f
        val headBob = if (walking) sin(phase * 2f + 0.5f) * 1.2f else breath * 0.35f
        canvas.save()
        canvas.rotate(if (walking) sin(phase) * 1.5f else 0f, 137f, 72f + headLift)

        // Neck-to-head silhouette.
        path.reset()
        path.moveTo(112f, 76f + bodyBob)
        path.cubicTo(117f, 56f + headLift, 132f, 48f + headLift, 148f, 55f + headLift)
        path.cubicTo(158f, 64f + headLift, 155f, 86f + headLift, 141f, 96f + bodyBob)
        path.cubicTo(128f, 98f + bodyBob, 117f, 90f + bodyBob, 112f, 76f + bodyBob)
        path.close()
        canvas.drawPath(path, coat)

        // Skull and cheek mask.
        path.reset()
        path.moveTo(124f, 58f + headLift)
        path.cubicTo(133f, 46f + headLift, 150f, 49f + headLift, 158f, 62f + headLift)
        path.cubicTo(164f, 73f + headLift, 156f, 88f + headLift, 144f, 91f + headLift)
        path.cubicTo(131f, 88f + headLift, 121f, 75f + headLift, 124f, 58f + headLift)
        path.close()
        canvas.drawPath(path, darkCoat)

        // Upright triangular ears with warm inner fur.
        path.reset()
        path.moveTo(127f, 59f + headLift)
        path.cubicTo(123f, 45f + headLift, 119f, 31f + headLift, 126f, 27f + headLift)
        path.cubicTo(134f, 34f + headLift, 137f, 45f + headLift, 138f, 57f + headLift)
        path.close()
        canvas.drawPath(path, black)
        path.reset()
        path.moveTo(130f, 50f + headLift)
        path.lineTo(126f, 33f + headLift)
        path.cubicTo(133f, 40f + headLift, 134f, 47f + headLift, 134f, 53f + headLift)
        path.close()
        canvas.drawPath(path, warm)

        path.reset()
        path.moveTo(145f, 56f + headLift)
        path.cubicTo(147f, 41f + headLift, 155f, 33f + headLift, 161f, 37f + headLift)
        path.cubicTo(164f, 46f + headLift, 159f, 57f + headLift, 153f, 65f + headLift)
        path.close()
        canvas.drawPath(path, black)
        path.reset()
        path.moveTo(151f, 54f + headLift)
        path.lineTo(158f, 41f + headLift)
        path.cubicTo(158f, 51f + headLift, 154f, 57f + headLift, 151f, 60f + headLift)
        path.close()
        canvas.drawPath(path, warm)

        // Long tapered muzzle, black nose and lower jaw.
        path.reset()
        path.moveTo(147f, 68f + headLift)
        path.cubicTo(160f, 65f + headLift, 173f, 70f + headLift, 177f, 78f + headLift)
        path.cubicTo(171f, 86f + headLift, 157f, 87f + headLift, 146f, 81f + headLift)
        path.close()
        canvas.drawPath(path, lightFur)
        path.reset()
        path.moveTo(151f, 79f + headLift)
        path.cubicTo(160f, 84f + headLift, 170f, 84f + headLift, 176f, 79f + headLift)
        path.cubicTo(172f, 91f + headLift, 158f, 91f + headLift, 151f, 84f + headLift)
        path.close()
        canvas.drawPath(path, black)
        canvas.drawOval(171f, 73f + headLift, 181f, 82f + headLift, black)

        // Eye, eyelid, glint and whisker pores.
        canvas.drawOval(145f, 62f + headLift, 151f, 68f + headLift, eye)
        canvas.drawCircle(147f, 63.5f + headLift, 1.2f, shine)
        line.color = 0xFF1A1715.toInt()
        line.strokeWidth = 1.4f
        canvas.drawLine(142f, 61f + headLift, 152f, 60f + headLift, line)
        for (i in 0..2) canvas.drawCircle(160f + i * 3f, 78f + headLift + (i % 2), 0.65f, detail)
        if (!sleeping) {
            canvas.drawOval(157f, 86f + headLift, 166f, 91f + headLift, tongue)
        }
        canvas.restore()

        // Soft fur around chest and lower silhouette.
        line.color = 0x99F1BD82.toInt()
        line.strokeWidth = 1.1f
        for (i in 0..5) {
            val x = 116f + i * 3f
            canvas.drawLine(x, 99f + bodyBob, x - 2f, 108f + bodyBob, line)
        }

        canvas.restore()
    }

    private fun drawLeg(canvas: Canvas, hipX: Float, hipY: Float, swing: Float,
                        hind: Boolean, near: Boolean) {
        val direction = if (hind) -1f else 1f
        val kneeX = hipX + direction * 7f + swing * 12f
        val kneeY = hipY + 17f
        val ankleX = hipX + swing * 17f + if (hind) -3f else 3f
        val ankleY = 132f - kotlin.math.abs(swing) * 2f
        legPaint.color = if (near) 0xFFB66A37.toInt() else 0xFF80502F.toInt()
        legPaint.strokeWidth = if (hind) 10f else 8f
        canvas.drawLine(hipX, hipY, kneeX, kneeY, legPaint)
        legPaint.strokeWidth = 7f
        canvas.drawLine(kneeX, kneeY, ankleX, ankleY, legPaint)
        canvas.drawCircle(kneeX, kneeY, 3.8f, warm)
        pawRect.set(ankleX - 7f, ankleY - 2f, ankleX + 8f, ankleY + 5f)
        canvas.drawOval(pawRect, black)
        canvas.drawOval(ankleX - 4f, ankleY - 1f, ankleX + 4f, ankleY + 2f, warm)
    }

    private fun drawRestingLeg(canvas: Canvas, x: Float, y: Float, length: Float, near: Boolean) {
        legPaint.color = if (near) 0xFFB66A37.toInt() else 0xFF80502F.toInt()
        legPaint.strokeWidth = 10f
        canvas.drawLine(x, y, x + 13f, y + 7f, legPaint)
        canvas.drawLine(x + 13f, y + 7f, x + length, y + 7f, legPaint)
        canvas.drawOval(x + length - 5f, y + 3f, x + length + 10f, y + 12f, black)
    }
}
