/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import android.util.TypedValue
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ViewProps

/**
 * Utility class that helps with converting android drawable description used in JS to an actual
 * instance of [Drawable].
 */
public object ReactDrawableHelper {

  private val resolveOutValue = TypedValue()

  @JvmStatic
  public fun createDrawableFromJSDescription(
      context: Context,
      drawableDescriptionDict: ReadableMap
  ): Drawable? {
    val type = drawableDescriptionDict.getString("type")
    if ("ThemeAttrAndroid" == type) {
      val attr =
          drawableDescriptionDict.getString("attribute")
              ?: throw JSApplicationIllegalArgumentException(
                  "JS description missing 'attribute' field")
      val attrId = getAttrId(context, attr)
      if (!context.theme.resolveAttribute(attrId, resolveOutValue, true)) {
        throw JSApplicationIllegalArgumentException(
            "Attribute $attr with id $attrId couldn't be resolved into a drawable")
      }
      val drawable = getDefaultThemeDrawable(context)
      return setRadius(drawableDescriptionDict, drawable)
    } else if ("RippleAndroid" == type) {
      val rd = getRippleDrawable(context, drawableDescriptionDict)
      return setRadius(drawableDescriptionDict, rd)
    } else {
      throw JSApplicationIllegalArgumentException("Invalid type for android drawable: $type")
    }
  }

  @SuppressLint("DiscouragedApi", "InternalInsetResource")
  private fun getAttrId(context: Context, attr: String): Int =
      if ("selectableItemBackground" == attr) {
        android.R.attr.selectableItemBackground
      } else if ("selectableItemBackgroundBorderless" == attr) {
        android.R.attr.selectableItemBackgroundBorderless
      } else {
        context.resources.getIdentifier(attr, "attr", "android")
      }

  private fun getDefaultThemeDrawable(context: Context): Drawable? =
      context.resources.getDrawable(resolveOutValue.resourceId, context.theme)

  private fun getRippleDrawable(
      context: Context,
      drawableDescriptionDict: ReadableMap
  ): RippleDrawable {
    val color = getColor(context, drawableDescriptionDict)
    val mask = getMask(drawableDescriptionDict)
    val colorStateList = ColorStateList(arrayOf(intArrayOf()), intArrayOf(color))

    return RippleDrawable(colorStateList, null, mask)
  }

  private fun setRadius(drawableDescriptionDict: ReadableMap, drawable: Drawable?): Drawable? {
    if (drawableDescriptionDict.hasKey("rippleRadius") && drawable is RippleDrawable) {
      val rippleRadius = drawableDescriptionDict.getDouble("rippleRadius")
      drawable.radius = PixelUtil.toPixelFromDIP(rippleRadius).toInt()
    }
    return drawable
  }

  private fun getColor(context: Context, drawableDescriptionDict: ReadableMap): Int =
      if (drawableDescriptionDict.hasKey(ViewProps.COLOR) &&
          !drawableDescriptionDict.isNull(ViewProps.COLOR)) {
        drawableDescriptionDict.getInt(ViewProps.COLOR)
      } else {
        if (context.theme.resolveAttribute(
            android.R.attr.colorControlHighlight, resolveOutValue, true)) {
          context.resources.getColor(resolveOutValue.resourceId, context.theme)
        } else {
          throw JSApplicationIllegalArgumentException(
              "Attribute colorControlHighlight couldn't be resolved into a drawable")
        }
      }

  private fun getMask(drawableDescriptionDict: ReadableMap): Drawable? {
    if (!drawableDescriptionDict.hasKey("borderless") ||
        drawableDescriptionDict.isNull("borderless") ||
        !drawableDescriptionDict.getBoolean("borderless")) {
      return ColorDrawable(Color.WHITE)
    }
    return null
  }
}
