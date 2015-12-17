/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.uimanager.ViewProps;

/**
 * Utility class that helps with converting android drawable description used in JS to an actual
 * instance of {@link Drawable}.
 */
public class ReactDrawableHelper {

  private static final TypedValue sResolveOutValue = new TypedValue();

  public static Drawable createDrawableFromJSDescription(
      Context context,
      ReadableMap drawableDescriptionDict) {
    String type = drawableDescriptionDict.getString("type");
    if ("ThemeAttrAndroid".equals(type)) {
      String attr = drawableDescriptionDict.getString("attribute");
      SoftAssertions.assertNotNull(attr);
      int attrID = context.getResources().getIdentifier(attr, "attr", "android");
      if (attrID == 0) {
        throw new JSApplicationIllegalArgumentException("Attribute " + attr +
            " couldn't be found in the resource list");
      }
      if (context.getTheme().resolveAttribute(attrID, sResolveOutValue, true)) {
        final int version = Build.VERSION.SDK_INT;
        if (version >= 21) {
          return context.getResources()
              .getDrawable(sResolveOutValue.resourceId, context.getTheme());
        } else {
          return context.getResources().getDrawable(sResolveOutValue.resourceId);
        }
      } else {
        throw new JSApplicationIllegalArgumentException("Attribute " + attr +
            " couldn't be resolved into a drawable");
      }
    } else if ("RippleAndroid".equals(type)) {
      if (Build.VERSION.SDK_INT < 21) {
        throw new JSApplicationIllegalArgumentException("Ripple drawable is not available on " +
            "android API <21");
      }
      int color;
      if (drawableDescriptionDict.hasKey(ViewProps.COLOR) &&
          !drawableDescriptionDict.isNull(ViewProps.COLOR)) {
        color = drawableDescriptionDict.getInt(ViewProps.COLOR);
      } else {
        if (context.getTheme().resolveAttribute(
            android.R.attr.colorControlHighlight,
            sResolveOutValue,
            true)) {
          color = context.getResources().getColor(sResolveOutValue.resourceId);
        } else {
          throw new JSApplicationIllegalArgumentException("Attribute colorControlHighlight " +
              "couldn't be resolved into a drawable");
        }
      }
      Drawable mask = null;
      if (!drawableDescriptionDict.hasKey("borderless") ||
          drawableDescriptionDict.isNull("borderless") ||
          !drawableDescriptionDict.getBoolean("borderless")) {
        mask = new ColorDrawable(Color.WHITE);
      }
      ColorStateList colorStateList = new ColorStateList(
          new int[][] {new int[]{}},
          new int[] {color});
      return new RippleDrawable(colorStateList, null, mask);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid type for android drawable: " + type);
    }
  }
}
