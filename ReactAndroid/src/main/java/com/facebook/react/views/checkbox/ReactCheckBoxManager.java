/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.checkbox;

import android.content.Context;
import android.content.res.ColorStateList;
import android.util.TypedValue;
import android.widget.CompoundButton;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.TintContextWrapper;
import androidx.core.widget.CompoundButtonCompat;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
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
              .getNativeModule(UIManagerModule.class)
              .getEventDispatcher()
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

  private static int getThemeColor(final Context context, String colorId) {
    final TypedValue value = new TypedValue();
    context.getTheme().resolveAttribute(getIdentifier(context, colorId), value, true);
    return value.data;
  }

  /**
   * The appcompat-v7 BUCK dep is listed as a provided_dep, which complains that
   * com.facebook.react.R doesn't exist. Since the attributes are provided from a parent, we can
   * access those attributes dynamically.
   */
  private static int getIdentifier(Context context, String name) {
    return context.getResources().getIdentifier(name, "attr", context.getPackageName());
  }

  @ReactProp(name = "tintColors")
  public void setTintColors(ReactCheckBox view, @Nullable ReadableMap colorsMap) {
    String defaultColorIdOfCheckedState = "colorAccent";
    int trueColor =
        colorsMap == null || !colorsMap.hasKey("true")
            ? getThemeColor(view.getContext(), defaultColorIdOfCheckedState)
            : colorsMap.getInt("true");

    String defaultColorIdOfUncheckedState = "colorPrimaryDark";
    int falseColor =
        colorsMap == null || !colorsMap.hasKey("false")
            ? getThemeColor(view.getContext(), defaultColorIdOfUncheckedState)
            : colorsMap.getInt("false");

    ColorStateList csl =
        new ColorStateList(
            new int[][] {
              new int[] {android.R.attr.state_checked}, new int[] {-android.R.attr.state_checked}
            },
            new int[] {
              trueColor, falseColor,
            });

    CompoundButtonCompat.setButtonTintList(view, csl);
  }
}
