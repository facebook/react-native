/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.TypedValue;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ViewProps;

/**
 * Utility class that helps with converting android drawable description used in JS to an actual
 * instance of {@link Drawable}.
 */
public class ReactDrawableHelper {

  private static final TypedValue sResolveOutValue = new TypedValue();

  public static Drawable createDrawableFromJSDescription(
      Context context, ReadableMap drawableDescriptionDict) {
    String type = drawableDescriptionDict.getString("type");
    if ("ThemeAttrAndroid".equals(type)) {
      String attr = drawableDescriptionDict.getString("attribute");
      int attrId = getAttrId(context, attr);
      if (!context.getTheme().resolveAttribute(attrId, sResolveOutValue, true)) {
        throw new JSApplicationIllegalArgumentException(
            "Attribute " + attr + " with id " + attrId + " couldn't be resolved into a drawable");
      }
      Drawable drawable = getDefaultThemeDrawable(context);
      return setRadius(drawableDescriptionDict, drawable);
    } else if ("RippleAndroid".equals(type)) {
      RippleDrawable rd = getRippleDrawable(context, drawableDescriptionDict);
      return setRadius(drawableDescriptionDict, rd);
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid type for android drawable: " + type);
    }
  }

  private static int getAttrId(Context context, String attr) {
    SoftAssertions.assertNotNull(attr);
    if ("selectableItemBackground".equals(attr)) {
      return android.R.attr.selectableItemBackground;
    } else if ("selectableItemBackgroundBorderless".equals(attr)) {
      return android.R.attr.selectableItemBackgroundBorderless;
    } else {
      return context.getResources().getIdentifier(attr, "attr", "android");
    }
  }

  private static Drawable getDefaultThemeDrawable(Context context) {
    return context.getResources().getDrawable(sResolveOutValue.resourceId, context.getTheme());
  }

  private static RippleDrawable getRippleDrawable(
      Context context, ReadableMap drawableDescriptionDict) {
    int color = getColor(context, drawableDescriptionDict);
    Drawable mask = getMask(drawableDescriptionDict);
    ColorStateList colorStateList =
        new ColorStateList(new int[][] {new int[] {}}, new int[] {color});

    return new RippleDrawable(colorStateList, null, mask);
  }

  private static Drawable setRadius(ReadableMap drawableDescriptionDict, Drawable drawable) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
        && drawableDescriptionDict.hasKey("rippleRadius")
        && drawable instanceof RippleDrawable) {
      RippleDrawable rippleDrawable = (RippleDrawable) drawable;
      double rippleRadius = drawableDescriptionDict.getDouble("rippleRadius");
      rippleDrawable.setRadius((int) PixelUtil.toPixelFromDIP(rippleRadius));
    }
    return drawable;
  }

  private static int getColor(Context context, ReadableMap drawableDescriptionDict) {
    if (drawableDescriptionDict.hasKey(ViewProps.COLOR)
        && !drawableDescriptionDict.isNull(ViewProps.COLOR)) {
      return drawableDescriptionDict.getInt(ViewProps.COLOR);
    } else {
      if (context
          .getTheme()
          .resolveAttribute(android.R.attr.colorControlHighlight, sResolveOutValue, true)) {
        return context.getResources().getColor(sResolveOutValue.resourceId);
      } else {
        throw new JSApplicationIllegalArgumentException(
            "Attribute colorControlHighlight couldn't be resolved into a drawable");
      }
    }
  }

  private static @Nullable Drawable getMask(ReadableMap drawableDescriptionDict) {
    if (!drawableDescriptionDict.hasKey("borderless")
        || drawableDescriptionDict.isNull("borderless")
        || !drawableDescriptionDict.getBoolean("borderless")) {
      return new ColorDrawable(Color.WHITE);
    }
    return null;
  }
}
