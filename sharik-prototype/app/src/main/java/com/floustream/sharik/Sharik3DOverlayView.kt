package com.floustream.sharik

import android.content.Context
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import android.widget.FrameLayout
import io.github.sceneview.SceneView
import io.github.sceneview.SurfaceType
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberEnvironment
import io.github.sceneview.rememberEnvironmentLoader
import io.github.sceneview.rememberModelInstance
import io.github.sceneview.rememberModelLoader
import io.github.sceneview.math.Rotation

/**
 * Transparent, real-time Filament viewport for the floating desktop companion.
 * The 3D scene is kept separate from the overlay service's window/drag logic.
 */
internal class Sharik3DOverlayView(context: Context) : FrameLayout(context) {
    private val poseState = mutableIntStateOf(0)

    init {
        setWillNotDraw(true)
        val scene = ComposeView(context).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
            setContent { SharikDogScene(poseState.intValue) }
        }
        addView(scene, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun setPose(pose: Int) {
        poseState.intValue = pose.coerceIn(0, 2)
    }
}

@Composable
private fun SharikDogScene(pose: Int) {
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine)
    val environmentLoader = rememberEnvironmentLoader(engine)
    val environment = rememberEnvironment(environmentLoader, isOpaque = false)
    val model = rememberModelInstance(modelLoader, "german-shepherd.glb")
    val animation = when (pose) {
        0 -> "Walk"
        1 -> "Idle"
        else -> "Sit"
    }

    SceneView(
        modifier = Modifier.fillMaxSize(),
        surfaceType = SurfaceType.TextureSurface,
        engine = engine,
        modelLoader = modelLoader,
        environmentLoader = environmentLoader,
        environment = environment,
        isOpaque = false,
        cameraManipulator = null
    ) {
        model?.let { instance ->
            ModelNode(
                modelInstance = instance,
                scaleToUnits = 0.9f,
                rotation = Rotation(y = 90f),
                autoAnimate = false,
                animationName = animation,
                animationLoop = true,
                animationSpeed = if (pose == 0) 1.08f else 1.0f
            )
        }
    }
}
