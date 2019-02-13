/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.views.checkbox;

import android.content.Context;
import android.support.v7.widget.TintContextWrapper;
import android.widget.CompoundButton;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/** View manager for {@link ReactCheckBox} components. */
public class ReactCheckBoxManager extends SimpleViewManager<ReactCheckBox> {

  private static final String REACT_CLASS = "AndroidCheckBox";

  private static final CompoundButton.OnCheckedChangeListener ON_CHECKED_CHANGE_LISTENER =
      new CompoundButton.OnCheckedChangeListener() {
        @Override
        public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
          ReactContext reactContext = getReactContext(buttonView);
          reactContext
              .getNativeModule(UIManagerModule.class).getEventDispatcher()
              .dispatchEvent(new ReactCheckBoxEvent(buttonView.getId(), isChecked));
        }

        private ReactContext getReactContext(CompoundButton buttonView) {
          ReactContext reactContext;
          Context ctx = buttonView.getContext();
          if (ctx instanceof TintContextWrapper) {
            reactContext = (ReactContext) ((TintContextWrapper) ctx).getBaseContext();
          } else {
            reactContext = (ReactContext) buttonView.getContext();
          }
          return reactContext;
        }
      };

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactCheckBox view) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

  @Override
  protected ReactCheckBox createViewInstance(ThemedReactContext context) {
    ReactCheckBox view = new ReactCheckBox(context);
    return view;
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactCheckBox view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = ViewProps.ON)
  public void setOn(ReactCheckBox view, boolean on) {
    // we set the checked change listener to null and then restore it so that we don't fire an
    // onChange event to JS when JS itself is updating the value of the checkbox
    view.setOnCheckedChangeListener(null);
    view.setOn(on);
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }
}
