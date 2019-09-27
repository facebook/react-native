/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.appearance;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/** Module that exposes the user's preferred color scheme. For API >= 29. */
@ReactModule(name = AppearanceModule.NAME)
public class AppearanceModule extends ReactContextBaseJavaModule {
  public static final String NAME = "Appearance";

  private static final String APPEARANCE_CHANGED_EVENT_NAME = "appearanceChanged";
  private static final int ANDROID_TEN = 29;

  private String mColorScheme = "light";

  public AppearanceModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mColorScheme = colorSchemeForCurrentConfiguration(reactContext);
  }

  private static String colorSchemeForCurrentConfiguration(Context context) {
    // TODO: (hramos) T52929922: Switch to Build.VERSION_CODES.ANDROID_TEN or equivalent
    if (Build.VERSION.SDK_INT >= ANDROID_TEN) {
      int currentNightMode =
          context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
      switch (currentNightMode) {
        case Configuration.UI_MODE_NIGHT_NO:
          return "light";
        case Configuration.UI_MODE_NIGHT_YES:
          return "dark";
      }
    }

    return "light";
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getColorScheme() {
    mColorScheme = colorSchemeForCurrentConfiguration(getReactApplicationContext());
    return mColorScheme;
  }

  /** Stub */
  @ReactMethod
  public void addListener(String eventName) {}

  /** Stub */
  @ReactMethod
  public void removeListeners(double count) {}

  /*
   * Call this from your root activity whenever configuration changes. If the
   * color scheme has changed, an event will emitted.
   */
  public void onConfigurationChanged() {
    String newColorScheme = colorSchemeForCurrentConfiguration(getReactApplicationContext());
    if (!mColorScheme.equals(newColorScheme)) {
      mColorScheme = newColorScheme;
      emitAppearanceChanged(mColorScheme);
    }
  }

  /** Sends an event to the JS instance that the preferred color scheme has changed. */
  public void emitAppearanceChanged(String colorScheme) {
    WritableMap appearancePreferences = Arguments.createMap();
    appearancePreferences.putString("colorScheme", colorScheme);

    getReactApplicationContext()
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit(APPEARANCE_CHANGED_EVENT_NAME, appearancePreferences);
  }
}
