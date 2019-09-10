// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.jni;

import androidx.annotation.Keep;
import com.facebook.soloader.SoLoader;

/** Utility class to determine CPU capabilities */
@Keep
public class CpuCapabilitiesJni {

  static {
    SoLoader.loadLibrary("fb");
  }

  @Keep
  public static native boolean nativeDeviceSupportsNeon();

  @Keep
  public static native boolean nativeDeviceSupportsVFPFP16();

  @Keep
  public static native boolean nativeDeviceSupportsX86();
}
