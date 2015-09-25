/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.Collections;
import java.util.Map;
import java.util.HashMap;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import com.facebook.react.bridge.ReadableMap;

/**
 * Takes common view properties from JS and applies them to a given {@link View}.
 *
 * TODO(krzysztof): Blow away this class once refactoring is complete
 */
public class BaseViewPropertyApplicator {

  private static final String PROP_DECOMPOSED_MATRIX = "decomposedMatrix";
  private static final String PROP_DECOMPOSED_MATRIX_ROTATE = "rotate";
  private static final String PROP_DECOMPOSED_MATRIX_SCALE_X = "scaleX";
  private static final String PROP_DECOMPOSED_MATRIX_SCALE_Y = "scaleY";
  private static final String PROP_DECOMPOSED_MATRIX_TRANSLATE_X = "translateX";
  private static final String PROP_DECOMPOSED_MATRIX_TRANSLATE_Y = "translateY";
  private static final String PROP_OPACITY = "opacity";
  private static final String PROP_RENDER_TO_HARDWARE_TEXTURE = "renderToHardwareTextureAndroid";
  private static final String PROP_ACCESSIBILITY_LABEL = "accessibilityLabel";
  private static final String PROP_ACCESSIBILITY_COMPONENT_TYPE = "accessibilityComponentType";
  private static final String PROP_ACCESSIBILITY_LIVE_REGION = "accessibilityLiveRegion";
  private static final String PROP_IMPORTANT_FOR_ACCESSIBILITY = "importantForAccessibility";

  // DEPRECATED
  private static final String PROP_ROTATION = "rotation";
  private static final String PROP_SCALE_X = "scaleX";
  private static final String PROP_SCALE_Y = "scaleY";
  private static final String PROP_TRANSLATE_X = "translateX";
  private static final String PROP_TRANSLATE_Y = "translateY";

  /**
   * Used to locate views in end-to-end (UI) tests.
   */
  public static final String PROP_TEST_ID = "testID";

  private static final Map<String, UIProp.Type> mCommonProps;
  static {
    Map props = new HashMap<String, UIProp.Type>();
    props.put(PROP_ACCESSIBILITY_LABEL, UIProp.Type.STRING);
    props.put(PROP_ACCESSIBILITY_COMPONENT_TYPE, UIProp.Type.STRING);
    props.put(PROP_ACCESSIBILITY_LIVE_REGION, UIProp.Type.STRING);
    props.put(ViewProps.BACKGROUND_COLOR, UIProp.Type.STRING);
    props.put(PROP_IMPORTANT_FOR_ACCESSIBILITY, UIProp.Type.STRING);
    props.put(PROP_OPACITY, UIProp.Type.NUMBER);
    props.put(PROP_ROTATION, UIProp.Type.NUMBER);
    props.put(PROP_SCALE_X, UIProp.Type.NUMBER);
    props.put(PROP_SCALE_Y, UIProp.Type.NUMBER);
    props.put(PROP_TRANSLATE_X, UIProp.Type.NUMBER);
    props.put(PROP_TRANSLATE_Y, UIProp.Type.NUMBER);
    props.put(PROP_TEST_ID, UIProp.Type.STRING);
    props.put(PROP_RENDER_TO_HARDWARE_TEXTURE, UIProp.Type.BOOLEAN);
    mCommonProps = Collections.unmodifiableMap(props);
  }

  public static Map<String, UIProp.Type> getCommonProps() {
    return mCommonProps;
  }

  public static void applyCommonViewProperties(View view, CatalystStylesDiffMap props) {
    if (props.hasKey(ViewProps.BACKGROUND_COLOR)) {
      final int backgroundColor = props.getInt(ViewProps.BACKGROUND_COLOR, Color.TRANSPARENT);
      view.setBackgroundColor(backgroundColor);
    }
    if (props.hasKey(PROP_DECOMPOSED_MATRIX)) {
      ReadableMap decomposedMatrix = props.getMap(PROP_DECOMPOSED_MATRIX);
      if (decomposedMatrix == null) {
        resetTransformMatrix(view);
      } else {
        setTransformMatrix(view, decomposedMatrix);
      }
    }
    if (props.hasKey(PROP_OPACITY)) {
      view.setAlpha(props.getFloat(PROP_OPACITY, 1.f));
    }
    if (props.hasKey(PROP_RENDER_TO_HARDWARE_TEXTURE)) {
      boolean useHWTexture = props.getBoolean(PROP_RENDER_TO_HARDWARE_TEXTURE, false);
      view.setLayerType(useHWTexture ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
    }

    if (props.hasKey(PROP_TEST_ID)) {
      view.setTag(props.getString(PROP_TEST_ID));
    }

    if (props.hasKey(PROP_ACCESSIBILITY_LABEL)) {
      view.setContentDescription(props.getString(PROP_ACCESSIBILITY_LABEL));
    }
    if (props.hasKey(PROP_ACCESSIBILITY_COMPONENT_TYPE)) {
      AccessibilityHelper.updateAccessibilityComponentType(
          view,
          props.getString(PROP_ACCESSIBILITY_COMPONENT_TYPE));
    }
    if (props.hasKey(PROP_ACCESSIBILITY_LIVE_REGION)) {
      if (Build.VERSION.SDK_INT >= 19) {
        String liveRegionString = props.getString(PROP_ACCESSIBILITY_LIVE_REGION);
        if (liveRegionString == null || liveRegionString.equals("none")) {
          view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_NONE);
        } else if (liveRegionString.equals("polite")) {
          view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        } else if (liveRegionString.equals("assertive")) {
          view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_ASSERTIVE);
        }
      }
    }
    if (props.hasKey(PROP_IMPORTANT_FOR_ACCESSIBILITY)) {
      String importantForAccessibility = props.getString(PROP_IMPORTANT_FOR_ACCESSIBILITY);
      if (importantForAccessibility == null || importantForAccessibility.equals("auto")) {
        view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_AUTO);
      } else if (importantForAccessibility.equals("yes")) {
        view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_YES);
      } else if (importantForAccessibility.equals("no")) {
        view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
      } else if (importantForAccessibility.equals("no-hide-descendants")) {
        view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
      }
    }

    // DEPRECATED
    if (props.hasKey(PROP_ROTATION)) {
      view.setRotation(props.getFloat(PROP_ROTATION, 0));
    }
    if (props.hasKey(PROP_SCALE_X)) {
      view.setScaleX(props.getFloat(PROP_SCALE_X, 1.f));
    }
    if (props.hasKey(PROP_SCALE_Y)) {
      view.setScaleY(props.getFloat(PROP_SCALE_Y, 1.f));
    }
    if (props.hasKey(PROP_TRANSLATE_X)) {
      view.setTranslationX(PixelUtil.toPixelFromDIP(props.getFloat(PROP_TRANSLATE_X, 0)));
    }
    if (props.hasKey(PROP_TRANSLATE_Y)) {
      view.setTranslationY(PixelUtil.toPixelFromDIP(props.getFloat(PROP_TRANSLATE_Y, 0)));
    }
  }

  private static void setTransformMatrix(View view, ReadableMap matrix) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(
      (float) matrix.getDouble(PROP_DECOMPOSED_MATRIX_TRANSLATE_X)));
    view.setTranslationY(PixelUtil.toPixelFromDIP(
      (float) matrix.getDouble(PROP_DECOMPOSED_MATRIX_TRANSLATE_Y)));
    view.setRotation(
      (float) matrix.getDouble(PROP_DECOMPOSED_MATRIX_ROTATE));
    view.setScaleX(
      (float) matrix.getDouble(PROP_DECOMPOSED_MATRIX_SCALE_X));
    view.setScaleY(
      (float) matrix.getDouble(PROP_DECOMPOSED_MATRIX_SCALE_Y));
  }

  private static void resetTransformMatrix(View view) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(0));
    view.setTranslationY(PixelUtil.toPixelFromDIP(0));
    view.setRotation(0);
    view.setScaleX(1);
    view.setScaleY(1);
  }
}
