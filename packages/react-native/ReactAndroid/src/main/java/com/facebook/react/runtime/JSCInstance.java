/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridData;
import com.facebook.jni.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class JSCInstance extends JSRuntimeFactory {
  static {
    SoLoader.loadLibrary("jscinstance");
  }

  @DoNotStrip
  protected static native HybridData initHybrid();

  public JSCInstance() {
    super(initHybrid());
  }
}
