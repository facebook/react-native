package com.facebook.react.views.text.internal.span

import android.graphics.LinearGradient
import android.graphics.Shader
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance

public class LinearGradientSpan(
    private val start: Float,
    private val colors: IntArray,
) : CharacterStyle(), ReactSpan,
    UpdateAppearance {
    public override fun updateDrawState(tp: TextPaint) {
        // without setting the paint color, the gradient appears "faded" if no foreground color span is also applied
        // https://stackoverflow.com/a/52289927
        tp.setColor(colors[0])
        val textShader: Shader =
            LinearGradient(
                start,
                0f,
                start + 150.0f,
                0f,
                colors,
                null,
                Shader.TileMode.MIRROR,
            )
        tp.setShader(textShader)
    }
}
