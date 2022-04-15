/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// switchview because switch is a keyword
package com.facebook.react.views.switchview;

import android.content.Context;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidSwitchManagerDelegate;
import com.facebook.react.viewmanagers.AndroidSwitchManagerInterface;
import com.facebook.yoga.YogaMeasureMode;
import kotlin.jvm.functions.Function2;

/** View manager for {@link ReactSwitch} components. */
public class ReactSwitchManager extends SimpleViewManager<ReactComposeSwitchView>
    implements AndroidSwitchManagerInterface<ReactComposeSwitchView> {

  public static final String REACT_CLASS = "AndroidSwitch";

  private static final Function2<ReactComposeSwitchView, Boolean, kotlin.Unit>
      ON_CHECKED_CHANGE_LISTENER =
          new Function2<ReactComposeSwitchView, Boolean, kotlin.Unit>() {
            @Override
            public kotlin.Unit invoke(ReactComposeSwitchView view, Boolean isChecked) {
              ReactContext reactContext = (ReactContext) view.getContext();

              int reactTag = view.getId();
              UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
                  .dispatchEvent(
                      new ReactSwitchEvent(
                          UIManagerHelper.getSurfaceId(reactContext), reactTag, isChecked));
              return null;
            }
          };

  private final ViewManagerDelegate<ReactComposeSwitchView> mDelegate;

  public ReactSwitchManager() {
    mDelegate = new AndroidSwitchManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new LayoutShadowNode();
  }

  @Override
  public Class getShadowNodeClass() {
    return LayoutShadowNode.class;
  }

  @Override
  protected ReactComposeSwitchView createViewInstance(ThemedReactContext context) {
    return new ReactComposeSwitchView(context);
  }

  @Override
  @ReactProp(name = "disabled", defaultBoolean = false)
  public void setDisabled(ReactComposeSwitchView composeView, boolean disabled) {
    composeView.setSwitchEnabled(!disabled);
  }

  @Override
  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactComposeSwitchView composeView, boolean enabled) {
    composeView.setSwitchEnabled(enabled);
  }

  @Override
  @ReactProp(name = ViewProps.ON)
  public void setOn(ReactComposeSwitchView view, boolean on) {
    view.setSwitchChecked(on);
  }

  @Override
  @ReactProp(name = "value")
  public void setValue(ReactComposeSwitchView view, boolean value) {
    view.setSwitchChecked(value);
  }

  @Override
  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactComposeSwitchView view, @Nullable Integer color) {
    //    this.setThumbColor(view, color);
  }

  @Override
  @ReactProp(name = "thumbColor", customType = "Color")
  public void setThumbColor(ReactComposeSwitchView view, @Nullable Integer color) {
    //    view.setThumbColor(color);
  }

  @Override
  @ReactProp(name = "trackColorForFalse", customType = "Color")
  public void setTrackColorForFalse(ReactComposeSwitchView view, @Nullable Integer color) {
    //    view.setTrackColorForFalse(color);
  }

  @Override
  @ReactProp(name = "trackColorForTrue", customType = "Color")
  public void setTrackColorForTrue(ReactComposeSwitchView view, @Nullable Integer color) {
    //    view.setTrackColorForTrue(color);
  }

  @Override
  @ReactProp(name = "trackTintColor", customType = "Color")
  public void setTrackTintColor(ReactComposeSwitchView view, @Nullable Integer color) {
    //    view.setTrackColor(color);
  }

  @Override
  public void setNativeValue(ReactComposeSwitchView view, boolean value) {
    view.setSwitchChecked(value);
  }

  @Override
  public void receiveCommand(
      @NonNull ReactComposeSwitchView view, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "setNativeValue":
        boolean value = args != null && args.getBoolean(0);
        view.setSwitchChecked(value);
        break;
    }
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext, final ReactComposeSwitchView view) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

  @Override
  protected ViewManagerDelegate<ReactComposeSwitchView> getDelegate() {
    return mDelegate;
  }

  @Override
  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    ReactSwitch view = new ReactSwitch(context);
    view.setShowText(false);
    int measureSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
    view.measure(measureSpec, measureSpec);

    System.out.println(
        "View measured to: " + view.getMeasuredWidth() + "x" + view.getMeasuredHeight());

    return ReactComposeSwitchKt.measureInBackground(context);
  }

  @Override
  protected void onAfterUpdateTransaction(@NonNull ReactComposeSwitchView view) {
    super.onAfterUpdateTransaction(view);
    view.updateView();
  }
}
