// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Base class that should be suitable for the majority of subclasses of {@link ViewManager}.
 * It provides support for base view properties such as backgroundColor, opacity, etc.
 */
public abstract class BaseViewManager<T extends View, C extends LayoutShadowNode>
    extends ViewManager<T, C> {

  private static final String PROP_BACKGROUND_COLOR = ViewProps.BACKGROUND_COLOR;
  private static final String PROP_TRANSFORM = "transform";
  private static final String PROP_OPACITY = "opacity";
  private static final String PROP_ELEVATION = "elevation";
  private static final String PROP_Z_INDEX = "zIndex";
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

  private static MatrixMathHelper.MatrixDecompositionContext sMatrixDecompositionContext =
      new MatrixMathHelper.MatrixDecompositionContext();
  private static double[] sTransformDecompositionArray = new double[16];

  @ReactProp(name = PROP_BACKGROUND_COLOR, defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setBackgroundColor(T view, int backgroundColor) {
    view.setBackgroundColor(backgroundColor);
  }

  @ReactProp(name = PROP_TRANSFORM)
  public void setTransform(T view, ReadableArray matrix) {
    if (matrix == null) {
      resetTransformProperty(view);
    } else {
      setTransformProperty(view, matrix);
    }
  }

  @ReactProp(name = PROP_OPACITY, defaultFloat = 1.f)
  public void setOpacity(T view, float opacity) {
    view.setAlpha(opacity);
  }

  @ReactProp(name = PROP_ELEVATION)
  public void setElevation(T view, float elevation) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      view.setElevation(PixelUtil.toPixelFromDIP(elevation));
    }
    // Do nothing on API < 21
  }

  @ReactProp(name = PROP_Z_INDEX)
  public void setZIndex(T view, float zIndex) {
    int integerZIndex = Math.round(zIndex);
    ViewGroupManager.setViewZIndex(view, integerZIndex);
  }

  @ReactProp(name = PROP_RENDER_TO_HARDWARE_TEXTURE)
  public void setRenderToHardwareTexture(T view, boolean useHWTexture) {
    view.setLayerType(useHWTexture ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
  }

  @ReactProp(name = PROP_TEST_ID)
  public void setTestId(T view, String testId) {
    view.setTag(testId);
  }

  @ReactProp(name = PROP_ACCESSIBILITY_LABEL)
  public void setAccessibilityLabel(T view, String accessibilityLabel) {
    view.setContentDescription(accessibilityLabel);
  }

  @ReactProp(name = PROP_ACCESSIBILITY_COMPONENT_TYPE)
  public void setAccessibilityComponentType(T view, String accessibilityComponentType) {
    AccessibilityHelper.updateAccessibilityComponentType(view, accessibilityComponentType);
  }

  @ReactProp(name = PROP_IMPORTANT_FOR_ACCESSIBILITY)
  public void setImportantForAccessibility(T view, String importantForAccessibility) {
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

  @Deprecated
  @ReactProp(name = PROP_ROTATION)
  public void setRotation(T view, float rotation) {
    view.setRotation(rotation);
  }

  @Deprecated
  @ReactProp(name = PROP_SCALE_X, defaultFloat = 1f)
  public void setScaleX(T view, float scaleX) {
    view.setScaleX(scaleX);
  }

  @Deprecated
  @ReactProp(name = PROP_SCALE_Y, defaultFloat = 1f)
  public void setScaleY(T view, float scaleY) {
    view.setScaleY(scaleY);
  }

  @Deprecated
  @ReactProp(name = PROP_TRANSLATE_X, defaultFloat = 0f)
  public void setTranslateX(T view, float translateX) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(translateX));
  }

  @Deprecated
  @ReactProp(name = PROP_TRANSLATE_Y, defaultFloat = 0f)
  public void setTranslateY(T view, float translateY) {
    view.setTranslationY(PixelUtil.toPixelFromDIP(translateY));
  }

  @ReactProp(name = PROP_ACCESSIBILITY_LIVE_REGION)
  public void setAccessibilityLiveRegion(T view, String liveRegion) {
    if (Build.VERSION.SDK_INT >= 19) {
      if (liveRegion == null || liveRegion.equals("none")) {
        view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_NONE);
      } else if (liveRegion.equals("polite")) {
        view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
      } else if (liveRegion.equals("assertive")) {
        view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_ASSERTIVE);
      }
    }
  }

  private static void setTransformProperty(View view, ReadableArray transforms) {
    TransformHelper.processTransform(transforms, sTransformDecompositionArray);
    MatrixMathHelper.decomposeMatrix(sTransformDecompositionArray, sMatrixDecompositionContext);
    view.setTranslationX(
        PixelUtil.toPixelFromDIP((float) sMatrixDecompositionContext.translation[0]));
    view.setTranslationY(
        PixelUtil.toPixelFromDIP((float) sMatrixDecompositionContext.translation[1]));
    view.setRotation((float) sMatrixDecompositionContext.rotationDegrees[2]);
    view.setRotationX((float) sMatrixDecompositionContext.rotationDegrees[0]);
    view.setRotationY((float) sMatrixDecompositionContext.rotationDegrees[1]);
    view.setScaleX((float) sMatrixDecompositionContext.scale[0]);
    view.setScaleY((float) sMatrixDecompositionContext.scale[1]);
  }

  private static void resetTransformProperty(View view) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(0));
    view.setTranslationY(PixelUtil.toPixelFromDIP(0));
    view.setRotation(0);
    view.setRotationX(0);
    view.setRotationY(0);
    view.setScaleX(1);
    view.setScaleY(1);
  }
}
