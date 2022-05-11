/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.library;

import android.graphics.Color;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.ColoredViewManagerDelegate;
import com.facebook.react.viewmanagers.ColoredViewManagerInterface;

@ReactModule(name = ColoredViewManager.NAME)
public class ColoredViewManager extends SimpleViewManager<ColoredView>
    implements ColoredViewManagerInterface<ColoredView> {

  public static final String NAME = "ColoredView";

  private final ViewManagerDelegate<ColoredView> mDelegate;

  public ColoredViewManager() {
    mDelegate = new ColoredViewManagerDelegate<>(this);
  }

  @Nullable
  @Override
  protected ViewManagerDelegate<ColoredView> getDelegate() {
    return mDelegate;
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected ColoredView createViewInstance(@NonNull ThemedReactContext context) {
    return new ColoredView(context);
  }

  @Override
  @ReactProp(name = "color")
  public void setColor(ColoredView view, @Nullable String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }
}
