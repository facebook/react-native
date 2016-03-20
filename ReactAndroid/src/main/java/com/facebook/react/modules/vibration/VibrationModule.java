/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.vibration;

import android.content.Context;
import android.os.Vibrator;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class VibrationModule extends ReactContextBaseJavaModule {

  public VibrationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "Vibration";
  }

  @ReactMethod
  public void vibrate(int duration) {
    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v != null) {
      v.vibrate(duration);
    }
  }
}
