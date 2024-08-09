/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.proguard.annotations.DoNotStrip;

/** JNI wrapper for `jsinspector_modern::InspectorFlags`. */
@Nullsafe(Nullsafe.Mode.LOCAL)
@DoNotStrip
public class InspectorFlags {
  static {
    DevSupportSoLoader.staticInit();
  }

  @DoNotStrip
  public static native boolean getEnableModernCDPRegistry();

  @DoNotStrip
  public static native boolean getEnableCxxInspectorPackagerConnection();

  private InspectorFlags() {}
}
