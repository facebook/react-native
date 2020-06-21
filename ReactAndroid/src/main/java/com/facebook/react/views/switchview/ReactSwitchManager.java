/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// switchview because switch is a keyword
package com.facebook.react.views.switchview;

import android.content.Context;
import android.view.View;
import android.widget.CompoundButton;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidSwitchManagerDelegate;
import com.facebook.react.viewmanagers.AndroidSwitchManagerInterface;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;

/** View manager for {@link ReactSwitch} components. */
public class ReactSwitchManager extends SimpleViewManager<ReactSwitch>
    implements AndroidSwitchManagerInterface<ReactSwitch> {

  public static final String REACT_CLASS = "AndroidSwitch";

  static class ReactSwitchShadowNode extends LayoutShadowNode implements YogaMeasureFunction {

    private int mWidth;
    private int mHeight;
    private boolean mMeasured;

    private ReactSwitchShadowNode() {
      initMeasureFunction();
    }

    private void initMeasureFunction() {
      setMeasureFunction(this);
    }

    @Override
    public long measure(
        YogaNode node,
        float width,
        YogaMeasureMode widthMode,
        float height,
        YogaMeasureMode heightMode) {
      if (!mMeasured) {
        // Create a switch with the default config and measure it; since we don't (currently)
        // support setting custom switch text, this is fine, as all switches will measure the same
        // on a specific device/theme/locale combination.
        ReactSwitch reactSwitch = new ReactSwitch(getThemedContext());
        reactSwitch.setShowText(false);
        final int spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
        reactSwitch.measure(spec, spec);
        mWidth = reactSwitch.getMeasuredWidth();
        mHeight = reactSwitch.getMeasuredHeight();
        mMeasured = true;
      }

      return YogaMeasureOutput.make(mWidth, mHeight);
    }
  }

  private static final CompoundButton.OnCheckedChangeListener ON_CHECKED_CHANGE_LISTENER =
      new CompoundButton.OnCheckedChangeListener() {
        @Override
        public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
          ReactContext reactContext = (ReactContext) buttonView.getContext();

          UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);

          if (uiManager == null) {
            return;
          }

          uiManager
              .getEventDispatcher()
              .dispatchEvent(new ReactSwitchEvent(buttonView.getId(), isChecked));
        }
      };

  private final ViewManagerDelegate<ReactSwitch> mDelegate;

  public ReactSwitchManager() {
    mDelegate = new AndroidSwitchManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new ReactSwitchShadowNode();
  }

  @Override
  public Class getShadowNodeClass() {
    return ReactSwitchShadowNode.class;
  }

  @Override
  protected ReactSwitch createViewInstance(ThemedReactContext context) {
    ReactSwitch view = new ReactSwitch(context);
    view.setShowText(false);
    return view;
  }

  @Override
  @ReactProp(name = "disabled", defaultBoolean = false)
  public void setDisabled(ReactSwitch view, boolean disabled) {
    view.setEnabled(!disabled);
  }

  @Override
  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSwitch view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @Override
  @ReactProp(name = ViewProps.ON)
  public void setOn(ReactSwitch view, boolean on) {
    setValueInternal(view, on);
  }

  @Override
  @ReactProp(name = "value")
  public void setValue(ReactSwitch view, boolean value) {
    setValueInternal(view, value);
  }

  @Override
  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSwitch view, @Nullable Integer color) {
    this.setThumbColor(view, color);
  }

  @Override
  @ReactProp(name = "thumbColor", customType = "Color")
  public void setThumbColor(ReactSwitch view, @Nullable Integer color) {
    view.setThumbColor(color);
  }

  @Override
  @ReactProp(name = "trackColorForFalse", customType = "Color")
  public void setTrackColorForFalse(ReactSwitch view, @Nullable Integer color) {
    view.setTrackColorForFalse(color);
  }

  @Override
  @ReactProp(name = "trackColorForTrue", customType = "Color")
  public void setTrackColorForTrue(ReactSwitch view, @Nullable Integer color) {
    view.setTrackColorForTrue(color);
  }

  @Override
  @ReactProp(name = "trackTintColor", customType = "Color")
  public void setTrackTintColor(ReactSwitch view, @Nullable Integer color) {
    view.setTrackColor(color);
  }

  @Override
  public void setNativeValue(ReactSwitch view, boolean value) {
    setValueInternal(view, value);
  }

  @Override
  public void receiveCommand(
      @NonNull ReactSwitch view, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "setNativeValue":
        setValueInternal(view, args != null && args.getBoolean(0));
        break;
    }
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSwitch view) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

  @Override
  protected ViewManagerDelegate<ReactSwitch> getDelegate() {
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
    return YogaMeasureOutput.make(
        PixelUtil.toDIPFromPixel(view.getMeasuredWidth()),
        PixelUtil.toDIPFromPixel(view.getMeasuredHeight()));
  }

  private static void setValueInternal(ReactSwitch view, boolean value) {
    // we set the checked change listener to null and then restore it so that we don't fire an
    // onChange event to JS when JS itself is updating the value of the switch
    view.setOnCheckedChangeListener(null);
    view.setOn(value);
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }
}
