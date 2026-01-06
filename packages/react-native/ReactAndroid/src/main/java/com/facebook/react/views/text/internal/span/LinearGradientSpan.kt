package com.facebook.react.views.text.internal.span

import android.graphics.LinearGradient
import android.graphics.Shader
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance

/**
 * Span that applies a linear gradient to text.
 *
 * @param start The x-offset for the gradient start position
 * @param colors Array of gradient colors
 * @param angle Gradient angle in degrees (0 = horizontal)
 * @param gradientWidth Width of the gradient pattern in pixels. Default is 100.
 */
public class LinearGradientSpan(
    private val start: Float,
    private val colors: IntArray,
    private val angle: Float = 0f,
    private val gradientWidth: Float = Float.NaN,
) : CharacterStyle(), ReactSpan,
    UpdateAppearance {
    public override fun updateDrawState(tp: TextPaint) {
        // without setting the paint color, the gradient appears "faded" if no foreground color span is also applied
        // https://stackoverflow.com/a/52289927
        tp.setColor(colors[0])

        val radians = Math.toRadians(angle.toDouble())
        val width = 20f
        val height = tp.textSize

        val centerX = start + width / 2
        val centerY = height / 2
        val length = Math.sqrt((width * width + height * height).toDouble()).toFloat() / 2

        val startX = centerX - length * Math.cos(radians).toFloat()
        val startY = centerY - length * Math.sin(radians).toFloat()
        val endX = centerX + length * Math.cos(radians).toFloat()
        val endY = centerY + length * Math.sin(radians).toFloat()

        // Match iOS: duplicate first color at end (RCTTextAttributes.mm:324)
        val adjustedColors = IntArray(colors.size + 1)
        System.arraycopy(colors, 0, adjustedColors, 0, colors.size)
        adjustedColors[colors.size] = colors[0]

        val textShader: Shader =
            LinearGradient(
                startX,
                startY,
                endX,
                endY,
                adjustedColors,
                null,
                Shader.TileMode.MIRROR,
            )
        tp.setShader(textShader)
    }
}
