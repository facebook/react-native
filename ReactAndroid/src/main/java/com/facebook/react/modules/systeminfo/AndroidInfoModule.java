/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.systeminfo;

import android.content.Context;
import android.os.Build;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
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

  private @Nullable ReactApplicationContext mReactApplicationContext;
  private boolean isTablet;

  public AndroidInfoModule(ReactApplicationContext reactContext) {
    this((Context) reactContext);
    mReactApplicationContext = reactContext;
  }

  public AndroidInfoModule(Context context) {
    mReactApplicationContext = null;
    isTablet = context.getResources().getConfiguration().smallestScreenWidthDp >= 600;
  }

  @Override
  public String getName() {
    return "PlatformConstants";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("Version", Build.VERSION.SDK_INT);
    constants.put("isTablet", isTablet);
    constants.put("ServerHost", AndroidInfoHelpers.getServerHost());
    constants.put("isTesting", "true".equals(System.getProperty(IS_TESTING)));
    constants.put("reactNativeVersion", ReactNativeVersion.VERSION);
    return constants;
  }
}
