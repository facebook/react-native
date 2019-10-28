/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.systeminfo;

import static android.content.Context.UI_MODE_SERVICE;

import android.annotation.SuppressLint;
import android.app.UiModeManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import android.provider.Settings.Secure;
import androidx.annotation.Nullable;
import com.facebook.react.R;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.HashMap;
import java.util.Map;

/** Module that exposes Android Constants to JS. */
@ReactModule(name = AndroidInfoModule.NAME)
@SuppressLint("HardwareIds")
public class AndroidInfoModule extends ReactContextBaseJavaModule implements TurboModule {
  public static final String NAME = "PlatformConstants";
  private static final String IS_TESTING = "IS_TESTING";

  public AndroidInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  /**
   * See:
   * https://developer.android.com/reference/android/app/UiModeManager.html#getCurrentModeType()
   */
  private String uiMode() {
    UiModeManager uiModeManager =
        (UiModeManager) getReactApplicationContext().getSystemService(UI_MODE_SERVICE);
    switch (uiModeManager.getCurrentModeType()) {
      case Configuration.UI_MODE_TYPE_TELEVISION:
        return "tv";
      case Configuration.UI_MODE_TYPE_CAR:
        return "car";
      case Configuration.UI_MODE_TYPE_DESK:
        return "desk";
      case Configuration.UI_MODE_TYPE_WATCH:
        return "watch";
      case Configuration.UI_MODE_TYPE_NORMAL:
        return "normal";
      default:
        return "unknown";
    }
  }

  @Override
  public String getName() {
    return "PlatformConstants";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("Version", Build.VERSION.SDK_INT);
    constants.put("Release", Build.VERSION.RELEASE);
    constants.put("Serial", Build.SERIAL);
    constants.put("Fingerprint", Build.FINGERPRINT);
    constants.put("Model", Build.MODEL);
    if (ReactBuildConfig.DEBUG) {
      constants.put("ServerHost", AndroidInfoHelpers.getServerHost(getReactApplicationContext().getApplicationContext()));
    }
    constants.put(
        "isTesting", "true".equals(System.getProperty(IS_TESTING)) || isRunningScreenshotTest());
    constants.put("reactNativeVersion", ReactNativeVersion.VERSION);
    constants.put("uiMode", uiMode());
    return constants;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getAndroidID() {
    return Secure.getString(getReactApplicationContext().getContentResolver(), Secure.ANDROID_ID);
  }

  @Override
  public void invalidate() {}

  private Boolean isRunningScreenshotTest() {
    try {
      Class.forName("android.support.test.rule.ActivityTestRule");
      return true;
    } catch (ClassNotFoundException ignored) {
      return false;
    }
  }
}
