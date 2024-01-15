/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStripAny;

/**
 * An empty {@link ReactNativeConfig} that is backed by the C++ implementation where the defaults
 * are store.
 */
@DoNotStripAny
public class EmptyReactNativeConfig implements ReactNativeConfig {

  @NonNull private final HybridData mHybridData;

  private static native HybridData initHybrid();

  public EmptyReactNativeConfig() {
    mHybridData = initHybrid();
  }

  @Override
  public native boolean getBool(final String param);

  @Override
  public native long getInt64(final String param);

  @Override
  public native String getString(final String param);

  @Override
  public native double getDouble(final String param);
}
