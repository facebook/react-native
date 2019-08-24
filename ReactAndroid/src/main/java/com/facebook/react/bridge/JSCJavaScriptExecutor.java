/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;
import com.facebook.jni.HybridData;

@Keep
/* package */ class JSCJavaScriptExecutor extends JavaScriptExecutor {
  static {
    ReactBridge.staticInit();
  }

  /* package */ JSCJavaScriptExecutor(ReadableNativeMap jscConfig) {
    super(initHybrid(jscConfig));
  }

  @Override
  public String getName() {
    return "JSCJavaScriptExecutor";
  }

  private static native HybridData initHybrid(ReadableNativeMap jscConfig);
}
