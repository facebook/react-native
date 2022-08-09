/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.vibration;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.facebook.fbreact.specs.NativeVibrationSpec;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;

@SuppressLint("MissingPermission")
@ReactModule(name = VibrationModule.NAME)
public class VibrationModule extends NativeVibrationSpec {

  public static final String NAME = "Vibration";

  public VibrationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void vibrate(double durationDouble) {
    int duration = (int) durationDouble;

    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v == null) {
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
    } else {
      v.vibrate(duration);
    }
  }

  @Override
  public void vibrateByPattern(ReadableArray pattern, double repeatDouble) {
    int repeat = (int) repeatDouble;

    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v == null) {
      return;
    }

    long[] patternLong = new long[pattern.size()];
    for (int i = 0; i < pattern.size(); i++) {
      patternLong[i] = pattern.getInt(i);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createWaveform(patternLong, repeat));
    } else {
      v.vibrate(patternLong, repeat);
    }
  }

  @Override
  public void cancel() {
    Vibrator v = (Vibrator) getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE);
    if (v != null) {
      v.cancel();
    }
  }
}
