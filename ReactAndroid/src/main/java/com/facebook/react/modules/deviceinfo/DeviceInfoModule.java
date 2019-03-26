/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import android.content.Context;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;

/**
 * Module that exposes Android Constants to JS.
 */
@ReactModule(name = DeviceInfoModule.sModuleName)
public class DeviceInfoModule extends BaseJavaModule implements
    LifecycleEventListener {

  static final String sModuleName = "DeviceInfo";

  private @Nullable ReactApplicationContext mReactApplicationContext;
  private float mFontScale;

  public DeviceInfoModule(ReactApplicationContext reactContext) {
    this((Context) reactContext);
    mReactApplicationContext = reactContext;
    mReactApplicationContext.addLifecycleEventListener(this);
  }

  public DeviceInfoModule(Context context) {
    mReactApplicationContext = null;
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context);
    mFontScale = context.getResources().getConfiguration().fontScale;
  }

  @Override
  public String getName() {
    return sModuleName;
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put(
        "Dimensions",
        DisplayMetricsHolder.getDisplayMetricsMap(mFontScale));
    return constants;
  }

  @Override
  public void onHostResume() {
    if (mReactApplicationContext == null) {
      return;
    }

    float fontScale = mReactApplicationContext.getResources().getConfiguration().fontScale;
    if (mFontScale != fontScale) {
      mFontScale = fontScale;
      emitUpdateDimensionsEvent();
    }
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostDestroy() {
  }

  public void emitUpdateDimensionsEvent() {
    if (mReactApplicationContext == null) {
      return;
    }

    mReactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("didUpdateDimensions", DisplayMetricsHolder.getDisplayMetricsNativeMap(mFontScale));
  }
}
