// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import android.graphics.Color;
import android.text.TextUtils;
import android.view.View;
import android.view.ViewParent;
import androidx.core.view.ViewCompat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import com.facebook.react.R;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.util.ReactFindViewUtil;

import javax.annotation.Nonnull;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Base class that should be suitable for the majority of subclasses of {@link ViewManager}.
 * It provides support for base view properties such as backgroundColor, opacity, etc.
 */
public abstract class BaseViewManager<T extends View, C extends LayoutShadowNode>
    extends ViewManager<T, C> {

  private static final String PROP_BACKGROUND_COLOR = ViewProps.BACKGROUND_COLOR;
  private static final String PROP_TRANSFORM = "transform";
  private static final String PROP_ELEVATION = "elevation";
  private static final String PROP_Z_INDEX = "zIndex";
  private static final String PROP_RENDER_TO_HARDWARE_TEXTURE = "renderToHardwareTextureAndroid";
  private static final String PROP_ACCESSIBILITY_LABEL = "accessibilityLabel";
  private static final String PROP_ACCESSIBILITY_HINT = "accessibilityHint";
  private static final String PROP_ACCESSIBILITY_LIVE_REGION = "accessibilityLiveRegion";
  private static final String PROP_ACCESSIBILITY_ROLE = "accessibilityRole";
  private static final String PROP_ACCESSIBILITY_STATES = "accessibilityStates";
  private static final String PROP_ACCESSIBILITY_ACTIONS = "accessibilityActions";
  private static final String PROP_IMPORTANT_FOR_ACCESSIBILITY = "importantForAccessibility";

  // DEPRECATED
  private static final String PROP_ROTATION = "rotation";
  private static final String PROP_SCALE_X = "scaleX";
  private static final String PROP_SCALE_Y = "scaleY";
  private static final String PROP_TRANSLATE_X = "translateX";
  private static final String PROP_TRANSLATE_Y = "translateY";

  private static final int PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX = 2;
  private static final float CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER = (float)Math.sqrt(5);

  /**
   * Used to locate views in end-to-end (UI) tests.
   */
  public static final String PROP_TEST_ID = "testID";
  public static final String PROP_NATIVE_ID = "nativeID";

  private static MatrixMathHelper.MatrixDecompositionContext sMatrixDecompositionContext =
      new MatrixMathHelper.MatrixDecompositionContext();
  private static double[] sTransformDecompositionArray = new double[16];

  public static final HashMap<String, Integer> sStateDescription= new HashMap<String, Integer>();
  static {
      sStateDescription.put("busy", R.string.state_busy_description);
      sStateDescription.put("expanded", R.string.state_expanded_description);
      sStateDescription.put("collapsed", R.string.state_collapsed_description);
  }

  @ReactProp(name = PROP_BACKGROUND_COLOR, defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setBackgroundColor(@Nonnull T view, int backgroundColor) {
    view.setBackgroundColor(backgroundColor);
  }

  @ReactProp(name = PROP_TRANSFORM)
  public void setTransform(@Nonnull T view, @Nullable ReadableArray matrix) {
    if (matrix == null) {
      resetTransformProperty(view);
    } else {
      setTransformProperty(view, matrix);
    }
  }

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1.f)
  public void setOpacity(@Nonnull T view, float opacity) {
    view.setAlpha(opacity);
  }

  @ReactProp(name = PROP_ELEVATION)
  public void setElevation(@Nonnull T view, float elevation) {
    ViewCompat.setElevation(view, PixelUtil.toPixelFromDIP(elevation));
  }

  @ReactProp(name = PROP_Z_INDEX)
  public void setZIndex(@Nonnull T view, float zIndex) {
    int integerZIndex = Math.round(zIndex);
    ViewGroupManager.setViewZIndex(view, integerZIndex);
    ViewParent parent = view.getParent();
    if (parent != null && parent instanceof ReactZIndexedViewGroup) {
      ((ReactZIndexedViewGroup) parent).updateDrawingOrder();
    }
  }

  @ReactProp(name = PROP_RENDER_TO_HARDWARE_TEXTURE)
  public void setRenderToHardwareTexture(@Nonnull T view, boolean useHWTexture) {
    view.setLayerType(useHWTexture ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
  }

  @ReactProp(name = PROP_TEST_ID)
  public void setTestId(@Nonnull T view, String testId) {
    view.setTag(R.id.react_test_id, testId);

    // temporarily set the tag and keyed tags to avoid end to end test regressions
    view.setTag(testId);
  }

  @ReactProp(name = PROP_NATIVE_ID)
  public void setNativeId(@Nonnull T view, String nativeId) {
    view.setTag(R.id.view_tag_native_id, nativeId);
    ReactFindViewUtil.notifyViewRendered(view);
  }

  @ReactProp(name = PROP_ACCESSIBILITY_LABEL)
  public void setAccessibilityLabel(@Nonnull T view, String accessibilityLabel) {
    view.setTag(R.id.accessibility_label, accessibilityLabel);
    updateViewContentDescription(view);
  }

  @ReactProp(name = PROP_ACCESSIBILITY_HINT)
  public void setAccessibilityHint(@Nonnull T view, String accessibilityHint) {
    view.setTag(R.id.accessibility_hint, accessibilityHint);
    updateViewContentDescription(view);
  }

  @ReactProp(name = PROP_ACCESSIBILITY_ROLE)
  public void setAccessibilityRole(@Nonnull T view, @Nullable String accessibilityRole) {
    if (accessibilityRole == null) {
      return;
    }
    view.setTag(R.id.accessibility_role, AccessibilityRole.fromValue(accessibilityRole));
  }

  @ReactProp(name = PROP_ACCESSIBILITY_STATES)
  public void setViewStates(@Nonnull T view, @Nullable ReadableArray accessibilityStates) {
    if (accessibilityStates == null) {
      return;
    }
    view.setTag(R.id.accessibility_states, accessibilityStates);
    view.setSelected(false);
    view.setEnabled(true);
    boolean shouldUpdateContentDescription = false;
    for (int i = 0; i < accessibilityStates.size(); i++) {
      String state = accessibilityStates.getString(i);
      if (sStateDescription.containsKey(state)) {
        shouldUpdateContentDescription = true;
      }
      if (state.equals("selected")) {
        view.setSelected(true);
      } else if (state.equals("disabled")) {
        view.setEnabled(false);
      }
    }
    if (shouldUpdateContentDescription) {
      updateViewContentDescription(view);
    }
  }

  private void updateViewContentDescription(@Nonnull T view) {
    final String accessibilityLabel = (String) view.getTag(R.id.accessibility_label);
    final ReadableArray accessibilityStates = (ReadableArray) view.getTag(R.id.accessibility_states);
    final String accessibilityHint = (String) view.getTag(R.id.accessibility_hint);
    final List<String> contentDescription = new ArrayList<>();
    if (accessibilityLabel != null) {
      contentDescription.add(accessibilityLabel);
    }
    if (accessibilityStates != null) {
      for (int i = 0; i < accessibilityStates.size(); i++) {
        String state = accessibilityStates.getString(i);
        if (sStateDescription.containsKey(state)) {
          contentDescription.add(view.getContext().getString(sStateDescription.get(state)));
        }
      }
    }
    if (accessibilityHint != null) {
      contentDescription.add(accessibilityHint);
    }
    if (contentDescription.size() > 0) {
      view.setContentDescription(TextUtils.join(", ", contentDescription));
    }
  }

  @ReactProp(name = PROP_ACCESSIBILITY_ACTIONS)
  public void setAccessibilityActions(T view, ReadableArray accessibilityActions) {
    if (accessibilityActions == null) {
      return;
    }

    view.setTag(R.id.accessibility_actions, accessibilityActions);
  }

  @ReactProp(name = PROP_IMPORTANT_FOR_ACCESSIBILITY)
  public void setImportantForAccessibility(@Nonnull T view, @Nullable String importantForAccessibility) {
    if (importantForAccessibility == null || importantForAccessibility.equals("auto")) {
      ViewCompat.setImportantForAccessibility(view, ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_AUTO);
    } else if (importantForAccessibility.equals("yes")) {
      ViewCompat.setImportantForAccessibility(view, ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_YES);
    } else if (importantForAccessibility.equals("no")) {
      ViewCompat.setImportantForAccessibility(view, ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO);
    } else if (importantForAccessibility.equals("no-hide-descendants")) {
      ViewCompat.setImportantForAccessibility(view, ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
    }
  }

  @Deprecated
  @ReactProp(name = PROP_ROTATION)
  public void setRotation(@Nonnull T view, float rotation) {
    view.setRotation(rotation);
  }

  @Deprecated
  @ReactProp(name = PROP_SCALE_X, defaultFloat = 1f)
  public void setScaleX(@Nonnull T view, float scaleX) {
    view.setScaleX(scaleX);
  }

  @Deprecated
  @ReactProp(name = PROP_SCALE_Y, defaultFloat = 1f)
  public void setScaleY(@Nonnull T view, float scaleY) {
    view.setScaleY(scaleY);
  }

  @Deprecated
  @ReactProp(name = PROP_TRANSLATE_X, defaultFloat = 0f)
  public void setTranslateX(@Nonnull T view, float translateX) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(translateX));
  }

  @Deprecated
  @ReactProp(name = PROP_TRANSLATE_Y, defaultFloat = 0f)
  public void setTranslateY(@Nonnull T view, float translateY) {
    view.setTranslationY(PixelUtil.toPixelFromDIP(translateY));
  }

  @ReactProp(name = PROP_ACCESSIBILITY_LIVE_REGION)
  public void setAccessibilityLiveRegion(@Nonnull T view, @Nullable String liveRegion) {
      if (liveRegion == null || liveRegion.equals("none")) {
        ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_NONE);
      } else if (liveRegion.equals("polite")) {
        ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_POLITE);
      } else if (liveRegion.equals("assertive")) {
        ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_ASSERTIVE);
      }
  }

  private static void setTransformProperty(@Nonnull View view, ReadableArray transforms) {
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

    double[] perspectiveArray = sMatrixDecompositionContext.perspective;

    if (perspectiveArray.length > PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX) {
      float invertedCameraDistance = (float) perspectiveArray[PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX];
      if (invertedCameraDistance == 0) {
        // Default camera distance, before scale multiplier (1280)
        invertedCameraDistance = 0.00078125f;
      }
      float cameraDistance = -1 / invertedCameraDistance;
      float scale = DisplayMetricsHolder.getScreenDisplayMetrics().density;

      // The following converts the matrix's perspective to a camera distance
      // such that the camera perspective looks the same on Android and iOS.
      // The native Android implementation removed the screen density from the
      // calculation, so squaring and a normalization value of
      // sqrt(5) produces an exact replica with iOS.
      // For more information, see https://github.com/facebook/react-native/pull/18302
      float normalizedCameraDistance = scale * scale * cameraDistance * CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER;
      view.setCameraDistance(normalizedCameraDistance);

    }
  }

  private static void resetTransformProperty(@Nonnull View view) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(0));
    view.setTranslationY(PixelUtil.toPixelFromDIP(0));
    view.setRotation(0);
    view.setRotationX(0);
    view.setRotationY(0);
    view.setScaleX(1);
    view.setScaleY(1);
    view.setCameraDistance(0);
  }

  private void updateViewAccessibility(@Nonnull T view) {
    ReactAccessibilityDelegate.setDelegate(view);
  }

  @Override
  protected void onAfterUpdateTransaction(@Nonnull T view) {
    super.onAfterUpdateTransaction(view);
    updateViewAccessibility(view);
  }

  @Override
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
          .put("performAction", MapBuilder.of("registrationName", "onAccessibilityAction"))
          .build();
  }
}
