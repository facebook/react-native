/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/** fbjni interface for reading `jsinspector_modern::InspectorFlags`. */
@DoNotStrip
public class InspectorFlags {
  static {
    ReactBridge.staticInit();
  }

  @DoNotStrip
  public static native boolean getEnableModernCDPRegistry();

  @DoNotStrip
  public static native boolean getEnableCxxInspectorPackagerConnection();

  private InspectorFlags() {}
}
