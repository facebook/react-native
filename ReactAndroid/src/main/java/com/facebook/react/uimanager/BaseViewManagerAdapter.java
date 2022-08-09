/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

public abstract class BaseViewManagerAdapter<T extends View>
    implements BaseViewManagerInterface<T> {
  @Override
  public void setAccessibilityActions(@NonNull T view, ReadableArray accessibilityActions) {}

  @Override
  public void setAccessibilityHint(@NonNull T view, String accessibilityHint) {}

  @Override
  public void setAccessibilityLabel(@NonNull T view, String accessibilityLabel) {}

  @Override
  public void setAccessibilityLiveRegion(@NonNull T view, @Nullable String liveRegion) {}

  @Override
  public void setAccessibilityRole(@NonNull T view, @Nullable String accessibilityRole) {}

  @Override
  public void setViewState(@NonNull T view, @Nullable ReadableMap accessibilityState) {}

  @Override
  public void setBackgroundColor(@NonNull T view, int backgroundColor) {}

  @Override
  public void setBorderRadius(@NonNull T view, float borderRadius) {}

  @Override
  public void setBorderBottomLeftRadius(@NonNull T view, float borderRadius) {}

  @Override
  public void setBorderBottomRightRadius(@NonNull T view, float borderRadius) {}

  @Override
  public void setBorderTopLeftRadius(@NonNull T view, float borderRadius) {}

  @Override
  public void setBorderTopRightRadius(@NonNull T view, float borderRadius) {}

  @Override
  public void setElevation(@NonNull T view, float elevation) {}

  @Override
  public void setShadowColor(@NonNull T view, int shadowColor) {}

  @Override
  public void setImportantForAccessibility(
      @NonNull T view, @Nullable String importantForAccessibility) {}

  @Override
  public void setNativeId(@NonNull T view, String nativeId) {}

  @Override
  public void setAccessibilityLabelledBy(@NonNull T view, Dynamic nativeId) {}

  @Override
  public void setOpacity(@NonNull T view, float opacity) {}

  @Override
  public void setRenderToHardwareTexture(@NonNull T view, boolean useHWTexture) {}

  @Override
  public void setRotation(@NonNull T view, float rotation) {}

  @Override
  public void setScaleX(@NonNull T view, float scaleX) {}

  @Override
  public void setScaleY(@NonNull T view, float scaleY) {}

  @Override
  public void setTestId(@NonNull T view, String testId) {}

  @Override
  public void setTransform(@NonNull T view, @Nullable ReadableArray matrix) {}

  @Override
  public void setTranslateX(@NonNull T view, float translateX) {}

  @Override
  public void setTranslateY(@NonNull T view, float translateY) {}

  @Override
  public void setZIndex(@NonNull T view, float zIndex) {}
}
