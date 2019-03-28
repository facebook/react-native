// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * Utility class to determine CPU capabilities
 */
@DoNotStrip
public class CpuCapabilitiesJni {

  static {
    SoLoader.loadLibrary("fb");
  }

  @DoNotStrip
  public static native boolean nativeDeviceSupportsNeon();

  @DoNotStrip
  public static native boolean nativeDeviceSupportsVFPFP16();

  @DoNotStrip
  public static native boolean nativeDeviceSupportsX86();

}
