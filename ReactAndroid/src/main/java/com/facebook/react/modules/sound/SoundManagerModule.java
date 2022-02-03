/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.sound;

import android.content.Context;
import android.media.AudioManager;
import com.facebook.fbreact.specs.NativeSoundManagerSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

/** {@link NativeModule} that allows Playing device sounds from JS. */
@ReactModule(name = SoundManagerModule.NAME)
public class SoundManagerModule extends NativeSoundManagerSpec {

  public static final String NAME = "SoundManager";

  public SoundManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void playTouchSound() {
    AudioManager audioManager =
        (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
    if (audioManager != null) {
      audioManager.playSoundEffect(AudioManager.FX_KEY_CLICK);
    }
  }
}
