/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.appearance;

import android.content.Context;
import android.content.res.Configuration;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeAppearanceSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/** Module that exposes the user's preferred color scheme. */
@ReactModule(name = AppearanceModule.NAME)
public class AppearanceModule extends NativeAppearanceSpec {

  public static final String NAME = "Appearance";

  private static final String APPEARANCE_CHANGED_EVENT_NAME = "appearanceChanged";

  private String mColorScheme = "light";

  private final @Nullable OverrideColorScheme mOverrideColorScheme;

  /** Optional override to the current color scheme */
  public interface OverrideColorScheme {

    /**
     * Color scheme will use the return value instead of the current system configuration. Available
     * scheme: {light, dark}
     */
    public String getScheme();
  }

  public AppearanceModule(ReactApplicationContext reactContext) {
    this(reactContext, null);
  }

  public AppearanceModule(
      ReactApplicationContext reactContext, @Nullable OverrideColorScheme overrideColorScheme) {
    super(reactContext);

    mOverrideColorScheme = overrideColorScheme;
    mColorScheme = colorSchemeForCurrentConfiguration(reactContext);
  }

  private String colorSchemeForCurrentConfiguration(Context context) {
    if (mOverrideColorScheme != null) {
      return mOverrideColorScheme.getScheme();
    }
    int currentNightMode =
        context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
    switch (currentNightMode) {
      case Configuration.UI_MODE_NIGHT_NO:
        return "light";
      case Configuration.UI_MODE_NIGHT_YES:
        return "dark";
    }

    return "light";
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public String getColorScheme() {
    mColorScheme = colorSchemeForCurrentConfiguration(getReactApplicationContext());
    return mColorScheme;
  }

  /** Stub */
  @Override
  public void addListener(String eventName) {}

  /** Stub */
  @Override
  public void removeListeners(double count) {}

  /*
   * Call this from your root activity whenever configuration changes. If the
   * color scheme has changed, an event will emitted.
   */
  public void onConfigurationChanged(Context currentContext) {
    String newColorScheme = colorSchemeForCurrentConfiguration(currentContext);
    if (!mColorScheme.equals(newColorScheme)) {
      mColorScheme = newColorScheme;
      emitAppearanceChanged(mColorScheme);
    }
  }

  /** Sends an event to the JS instance that the preferred color scheme has changed. */
  public void emitAppearanceChanged(String colorScheme) {
    WritableMap appearancePreferences = Arguments.createMap();
    appearancePreferences.putString("colorScheme", colorScheme);

    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext
          .getJSModule(RCTDeviceEventEmitter.class)
          .emit(APPEARANCE_CHANGED_EVENT_NAME, appearancePreferences);
    }
  }
}
