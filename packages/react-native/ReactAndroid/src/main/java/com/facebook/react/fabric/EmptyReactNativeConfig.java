/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * An empty {@link ReactNativeConfig} that is backed by the C++ implementation where the defaults
 * are store.
 */
@DoNotStrip
public class EmptyReactNativeConfig implements ReactNativeConfig {

  @NonNull @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private static native HybridData initHybrid();

  @DoNotStrip
  public EmptyReactNativeConfig() {
    mHybridData = initHybrid();
  }

  @Override
  @DoNotStrip
  public native boolean getBool(final String param);

  @Override
  @DoNotStrip
  public native long getInt64(final String param);

  @Override
  @DoNotStrip
  public native String getString(final String param);

  @Override
  @DoNotStrip
  public native double getDouble(final String param);
}
