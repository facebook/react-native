/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.deviceinfo;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import android.util.DisplayMetrics;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;

/**
 * Module that exposes Android Constants to JS.
 */
@ReactModule(name = "DeviceInfo")
public class DeviceInfoModule extends ReactContextBaseJavaModule implements
    LifecycleEventListener {

  private float mFontScale;

  public DeviceInfoModule(
      ReactApplicationContext reactContext) {
    super(reactContext);

    mFontScale = getReactApplicationContext().getResources().getConfiguration().fontScale;
  }

  @Override
  public String getName() {
    return "DeviceInfo";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put(
        "Dimensions",
        getDimensionsConstants());
    return constants;
  }

  @Override
  public void onHostResume() {
    float fontScale = getReactApplicationContext().getResources().getConfiguration().fontScale;
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
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("didUpdateDimensions", getDimensionsConstants());
  }

  private WritableMap getDimensionsConstants() {
    DisplayMetrics windowDisplayMetrics = DisplayMetricsHolder.getWindowDisplayMetrics();
    DisplayMetrics screenDisplayMetrics = DisplayMetricsHolder.getScreenDisplayMetrics();

    WritableMap windowDisplayMetricsMap = Arguments.createMap();
    windowDisplayMetricsMap.putInt("width", windowDisplayMetrics.widthPixels);
    windowDisplayMetricsMap.putInt("height", windowDisplayMetrics.heightPixels);
    windowDisplayMetricsMap.putDouble("scale", windowDisplayMetrics.density);
    windowDisplayMetricsMap.putDouble("fontScale", mFontScale);
    windowDisplayMetricsMap.putDouble("densityDpi", windowDisplayMetrics.densityDpi);

    WritableMap screenDisplayMetricsMap = Arguments.createMap();
    screenDisplayMetricsMap.putInt("width", screenDisplayMetrics.widthPixels);
    screenDisplayMetricsMap.putInt("height", screenDisplayMetrics.heightPixels);
    screenDisplayMetricsMap.putDouble("scale", screenDisplayMetrics.density);
    screenDisplayMetricsMap.putDouble("fontScale", mFontScale);
    screenDisplayMetricsMap.putDouble("densityDpi", screenDisplayMetrics.densityDpi);

    WritableMap dimensionsMap = Arguments.createMap();
    dimensionsMap.putMap("windowPhysicalPixels", windowDisplayMetricsMap);
    dimensionsMap.putMap("screenPhysicalPixels", screenDisplayMetricsMap);

    return dimensionsMap;
  }
}
