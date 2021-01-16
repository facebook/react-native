/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jscexecutor;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.soloader.SoLoader;

@DoNotStrip
/* package */ public class JSCExecutor extends JavaScriptExecutor {
  private static boolean loaded = false;
  static {
    loadLibrary();
  }

  public static void loadLibrary() throws UnsatisfiedLinkError {
    if (!loaded) {
      SoLoader.loadLibrary("jscexecutor");
    }
    loaded = true;
  }

  /* package */ JSCExecutor(ReadableNativeMap jscConfig) {
    super(initHybrid(jscConfig));
  }

  @Override
  public String getName() {
    return "JSCExecutor";
  }

  private static native HybridData initHybrid(ReadableNativeMap jscConfig);
}
