/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component;

import android.graphics.Color;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Legacy View manager (non Fabric compatible) for {@link MyNativeView} components. */
@ReactModule(name = MyLegacyViewManager.REACT_CLASS)
public class MyLegacyViewManager extends SimpleViewManager<MyNativeView> {

  public static final String REACT_CLASS = "RNTMyLegacyNativeView";
  private static final Integer COMMAND_CHANGE_BACKGROUND_COLOR = 42;
  private final ReactApplicationContext mCallerContext;

  public MyLegacyViewManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected MyNativeView createViewInstance(@NonNull ThemedReactContext reactContext) {
    MyNativeView view = new MyNativeView(reactContext);
    view.setBackgroundColor(Color.RED);
    return view;
  }

  @Override
  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1.f)
  public void setOpacity(@NonNull MyNativeView view, float opacity) {
    super.setOpacity(view, opacity);
  }

  @ReactProp(name = ViewProps.COLOR)
  public void setColor(@NonNull MyNativeView view, @Nullable String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }

  @ReactProp(name = "cornerRadius")
  public void setCornerRadius(@NonNull MyNativeView view, @Nullable float cornerRadius) {
    view.setCornerRadius(cornerRadius);
  }

  @Override
  public final Map<String, Object> getExportedViewConstants() {
    return Collections.singletonMap("PI", 3.14);
  }

  @Override
  public final Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    Map<String, Object> eventTypeConstants = new HashMap<String, Object>();
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                "onColorChanged",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled", "onColorChanged", "captured", "onColorChangedCapture")))
            .build());
    return eventTypeConstants;
  }

  @Override
  public void receiveCommand(
      @NonNull MyNativeView view, String commandId, @Nullable ReadableArray args) {
    if (commandId.contentEquals(COMMAND_CHANGE_BACKGROUND_COLOR.toString())) {
      int sentColor = Color.parseColor(args.getString(0));
      view.setBackgroundColor(sentColor);
    }
  }

  @Nullable
  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("changeBackgroundColor", COMMAND_CHANGE_BACKGROUND_COLOR);
  }
}
