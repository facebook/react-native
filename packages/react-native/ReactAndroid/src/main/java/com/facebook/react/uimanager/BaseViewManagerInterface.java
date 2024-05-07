/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * This is an interface that should be implemented by view managers supporting the base view
 * properties such as backgroundColor, opacity, etc.
 */
public interface BaseViewManagerInterface<T extends View> {
  void setAccessibilityActions(T view, @Nullable ReadableArray accessibilityActions);

  void setAccessibilityHint(T view, @Nullable String accessibilityHint);

  void setAccessibilityLabel(T view, @Nullable String accessibilityLabel);

  void setAccessibilityLiveRegion(T view, @Nullable String liveRegion);

  void setAccessibilityRole(T view, @Nullable String accessibilityRole);

  void setAccessibilityCollection(T view, @Nullable ReadableMap accessibilityCollection);

  void setAccessibilityCollectionItem(T view, @Nullable ReadableMap accessibilityCollectionItem);

  void setViewState(T view, @Nullable ReadableMap accessibilityState);

  void setBackgroundColor(T view, int backgroundColor);

  void setBorderRadius(T view, float borderRadius);

  void setBorderBottomLeftRadius(T view, float borderRadius);

  void setBorderBottomRightRadius(T view, float borderRadius);

  void setBorderTopLeftRadius(T view, float borderRadius);

  void setBorderTopRightRadius(T view, float borderRadius);

  void setElevation(T view, float elevation);

  void setFilter(T view, ReadableArray filter);

  void setShadowColor(T view, int shadowColor);

  void setImportantForAccessibility(T view, @Nullable String importantForAccessibility);

  void setRole(T view, @Nullable String role);

  void setNativeId(T view, @Nullable String nativeId);

  void setAccessibilityLabelledBy(T view, @Nullable Dynamic nativeId);

  void setOpacity(T view, float opacity);

  void setRenderToHardwareTexture(T view, boolean useHWTexture);

  void setRotation(T view, float rotation);

  void setScaleX(T view, float scaleX);

  void setScaleY(T view, float scaleY);

  void setTestId(T view, String testId);

  void setTransform(T view, @Nullable ReadableArray matrix);

  void setTransformOrigin(T view, @Nullable ReadableArray transformOrigin);

  void setTranslateX(T view, float translateX);

  void setTranslateY(T view, float translateY);

  void setZIndex(T view, float zIndex);
}
