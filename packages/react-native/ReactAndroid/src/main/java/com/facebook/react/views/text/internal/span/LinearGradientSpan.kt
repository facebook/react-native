package com.facebook.react.views.text.internal.span

import android.graphics.LinearGradient
import android.graphics.Shader
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance

public class LinearGradientSpan(
    private val start: Float,
    private val colors: IntArray,
    private val angle: Float = 0f,
) : CharacterStyle(), ReactSpan,
    UpdateAppearance {
    public override fun updateDrawState(tp: TextPaint) {
        // without setting the paint color, the gradient appears "faded" if no foreground color span is also applied
        // https://stackoverflow.com/a/52289927
        tp.setColor(colors[0])

        val radians = Math.toRadians(angle.toDouble())
        val width = 150.0f
        val height = tp.textSize

        val centerX = start + width / 2
        val centerY = height / 2
        val length = Math.sqrt((width * width + height * height).toDouble()).toFloat() / 2

        val startX = centerX - length * Math.cos(radians).toFloat()
        val startY = centerY - length * Math.sin(radians).toFloat()
        val endX = centerX + length * Math.cos(radians).toFloat()
        val endY = centerY + length * Math.sin(radians).toFloat()

        val textShader: Shader =
            LinearGradient(
                startX,
                startY,
                endX,
                endY,
                colors,
                null,
                Shader.TileMode.MIRROR,
            )
        tp.setShader(textShader)
    }
}
