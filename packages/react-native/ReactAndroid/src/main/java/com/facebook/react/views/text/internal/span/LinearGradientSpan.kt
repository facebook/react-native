package com.facebook.react.views.text.internal.span

import android.graphics.LinearGradient
import android.graphics.Shader
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance
import com.facebook.react.uimanager.PixelUtil.dpToPx

/**
 * Span that applies a linear gradient to text.
 *
 * @param start The x-offset for the gradient start position
 * @param colors Array of gradient colors
 * @param angle Gradient angle in degrees (0 = horizontal)
 * @param gradientWidth Width of the gradient pattern in DP. Default is 100px.
 * @param gradientMode "mirror" (default) or "clamp" - controls tiling behavior
 */
public class LinearGradientSpan(
    private val start: Float,
    private val colors: IntArray,
    private val angle: Float = 0f,
    private val gradientWidth: Float = Float.NaN,
    private val gradientMode: String? = "mirror",
) : CharacterStyle(), ReactSpan,
    UpdateAppearance {
    public override fun updateDrawState(tp: TextPaint) {
        val tileMode = if (gradientMode == "clamp") Shader.TileMode.CLAMP else Shader.TileMode.MIRROR

        // without setting the paint color, the gradient appears "faded" if no foreground color span is also applied
        // https://stackoverflow.com/a/52289927
        tp.setColor(colors[0])

        val radians = Math.toRadians(angle.toDouble())
        val width = if (gradientWidth.isNaN()) 100f else gradientWidth.dpToPx()
        val height = tp.textSize

        var centerX = start + width / 2
        if (tileMode == Shader.TileMode.CLAMP) {
          // Ignore the start param in clamp mode.
          centerX = width / 2
        }
        val centerY = height / 2
        val length = Math.sqrt((width * width + height * height).toDouble()).toFloat() / 2

        val startX = centerX - length * Math.cos(radians).toFloat()
        val startY = centerY - length * Math.sin(radians).toFloat()
        val endX = centerX + length * Math.cos(radians).toFloat()
        val endY = centerY + length * Math.sin(radians).toFloat()

        var adjustedColors = colors
        if (tileMode == Shader.TileMode.MIRROR) {
          // Mirror mode duplicates the first color at the end.
          adjustedColors = IntArray(colors.size + 1)
          System.arraycopy(colors, 0, adjustedColors, 0, colors.size)
          adjustedColors[colors.size] = colors[0]
        }

        val textShader: Shader =
            LinearGradient(
                startX,
                startY,
                endX,
                endY,
                adjustedColors,
                null,
                tileMode,
            )
        tp.setShader(textShader)
    }
}
