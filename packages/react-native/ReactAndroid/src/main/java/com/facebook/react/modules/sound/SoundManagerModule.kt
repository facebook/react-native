/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.sound

import android.content.Context
import android.media.AudioManager
import com.facebook.fbreact.specs.NativeSoundManagerSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

/** [NativeModule] that allows Playing device sounds from JS. */
@ReactModule(name = NativeSoundManagerSpec.NAME)
public class SoundManagerModule(reactContext: ReactApplicationContext?) :
    NativeSoundManagerSpec(reactContext) {
  public override fun playTouchSound() {
    val audioManager =
        getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE) as AudioManager
    audioManager.playSoundEffect(AudioManager.FX_KEY_CLICK)
  }

  public companion object {
    public const val NAME: String = NativeSoundManagerSpec.NAME
  }
}
