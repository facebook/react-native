/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.vibration

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.facebook.fbreact.specs.NativeVibrationSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule

@SuppressLint("MissingPermission")
@ReactModule(name = NativeVibrationSpec.NAME)
public class VibrationModule(reactContext: ReactApplicationContext) :
    NativeVibrationSpec(reactContext) {

  public override fun vibrate(durationDouble: Double) {
    val duration = durationDouble.toInt()
    val v = getVibrator() ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createOneShot(duration.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
      @Suppress("DEPRECATION") v.vibrate(duration.toLong())
    }
  }

  public override fun vibrateByPattern(pattern: ReadableArray, repeatDouble: Double) {
    val repeat = repeatDouble.toInt()
    val v = getVibrator() ?: return
    val patternLong = LongArray(pattern.size())
    for (i in 0 until pattern.size()) {
      patternLong[i] = pattern.getInt(i).toLong()
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createWaveform(patternLong, repeat))
    } else {
      @Suppress("DEPRECATION") v.vibrate(patternLong, repeat)
    }
  }

  public override fun cancel() {
    getVibrator()?.cancel()
  }

  private fun getVibrator(): Vibrator? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager =
            getReactApplicationContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE)
                as VibratorManager?
        vibratorManager?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getReactApplicationContext().getSystemService(Context.VIBRATOR_SERVICE) as Vibrator?
      }
}
