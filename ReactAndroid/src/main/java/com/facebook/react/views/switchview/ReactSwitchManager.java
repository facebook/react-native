/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// switchview because switch is a keyword
package com.facebook.react.views.switchview;

import android.graphics.PorterDuff;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;

import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * View manager for {@link ReactSwitch} components.
 */
public class ReactSwitchManager extends SimpleViewManager<ReactSwitch> {

  private static final String REACT_CLASS = "AndroidSwitch";

  static class ReactSwitchShadowNode extends LayoutShadowNode implements
      YogaMeasureFunction {

    private int mWidth;
    private int mHeight;
    private boolean mMeasured;

    private ReactSwitchShadowNode() {
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
        final int spec = View.MeasureSpec.makeMeasureSpec(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            View.MeasureSpec.UNSPECIFIED);
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
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSwitchEvent(
                  buttonView.getId(),
                  isChecked));
        }
      };

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

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSwitch view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = ViewProps.ON)
  public void setOn(ReactSwitch view, boolean on) {
    // we set the checked change listener to null and then restore it so that we don't fire an
    // onChange event to JS when JS itself is updating the value of the switch
    view.setOnCheckedChangeListener(null);
    view.setOn(on);
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSwitch view, Integer color) {
    if (color == null) {
      view.getThumbDrawable().clearColorFilter();
    } else {
      view.getThumbDrawable().setColorFilter(color, PorterDuff.Mode.MULTIPLY);
    }
  }

  @ReactProp(name = "trackTintColor", customType = "Color")
  public void setTrackTintColor(ReactSwitch view, Integer color) {
    if (color == null) {
      view.getTrackDrawable().clearColorFilter();
    } else {
      view.getTrackDrawable().setColorFilter(color, PorterDuff.Mode.MULTIPLY);
    }
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSwitch view) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }
}
