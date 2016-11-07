/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.i18nmanager;

import android.content.Context;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Locale;
import java.util.Map;

/**
 * {@link NativeModule} that allows JS to set allowRTL and get isRTL status.
 */
@ReactModule(name = "I18nManager")
public class I18nManagerModule extends ReactContextBaseJavaModule {

  private final I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();

  public I18nManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "I18nManager";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Context context = getReactApplicationContext().getBaseContext();
    final Locale locale = context.getResources().getConfiguration().locale;

    final Map<String, Object> constants = MapBuilder.newHashMap();
    constants.put("isRTL", sharedI18nUtilInstance.isRTL(getReactApplicationContext()));
    constants.put("localeIdentifier", locale.toString());
    return constants;
  }

  @ReactMethod
  public void allowRTL(boolean value) {
    sharedI18nUtilInstance.allowRTL(
      getReactApplicationContext(),
      value);
  }

  @ReactMethod
  public void forceRTL(boolean value) {
    sharedI18nUtilInstance.forceRTL(
      getReactApplicationContext(),
      value);
  }
}
