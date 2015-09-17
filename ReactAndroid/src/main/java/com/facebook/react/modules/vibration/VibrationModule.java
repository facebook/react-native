/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.vibration;

import android.os.Vibrator;
import android.content.Context;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.MapBuilder;

public class VibrationModule extends ReactContextBaseJavaModule {
  
  ReactApplicationContext reactContext;

  public VibrationModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "VibrationAndroid";
  }

  @ReactMethod
  public void vibrate(int duration) {
    Vibrator v = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
    v.vibrate(duration);  
  }
}
