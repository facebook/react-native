/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.systeminfo;

import android.os.Build;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * Module that exposes Android Constants to JS.
 */
@ReactModule(name = "PlatformConstants")
public class AndroidInfoModule extends BaseJavaModule {

  private static final String IS_TESTING = "IS_TESTING";

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
    constants.put("ServerHost", AndroidInfoHelpers.getServerHost());
    constants.put("isTesting", "true".equals(System.getProperty(IS_TESTING)));
    constants.put("reactNativeVersion", ReactNativeVersion.VERSION);
    return constants;
  }
}
