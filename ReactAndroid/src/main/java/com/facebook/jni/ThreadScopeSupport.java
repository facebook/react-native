// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.jni;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class ThreadScopeSupport {
  static {
    SoLoader.loadLibrary("fb");
  }

  // This is just used for ThreadScope::withClassLoader to have a java function
  // in the stack so that jni has access to the correct classloader.
  @DoNotStrip
  private static void runStdFunction(long ptr) {
    runStdFunctionImpl(ptr);
  }

  private static native void runStdFunctionImpl(long ptr);
}
