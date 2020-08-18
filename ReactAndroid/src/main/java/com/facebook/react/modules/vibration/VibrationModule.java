/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.vibration;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Vibrator;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;

@SuppressLint("MissingPermission")
@ReactModule(name = VibrationModule.NAME)
public class VibrationModule extends ReactContextBaseJavaModule {

  public static final String NAME = "Vibration";

  public VibrationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void vibrate(double durationDouble) {
    int duration = (int) durationDouble;

    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v != null) {
      v.vibrate(duration);
    }
  }

  @ReactMethod
  public void vibrateByPattern(ReadableArray pattern, int repeat) {
    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v != null) {
      long[] patternLong = new long[pattern.size()];
      for (int i = 0; i < pattern.size(); i++) {
        patternLong[i] = pattern.getInt(i);
      }
      v.vibrate(patternLong, repeat);
    }
  }

  @ReactMethod
  public void cancel() {
    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v != null) {
      v.cancel();
    }
  }
}
