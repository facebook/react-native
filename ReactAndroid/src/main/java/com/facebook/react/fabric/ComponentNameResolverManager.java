/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.RuntimeExecutor;

public class ComponentNameResolverManager {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public ComponentNameResolverManager(
      RuntimeExecutor runtimeExecutor, Object componentNameResolver) {
    mHybridData = initHybrid(runtimeExecutor, componentNameResolver);
    installJSIBindings();
  }

  private native HybridData initHybrid(
      RuntimeExecutor runtimeExecutor, Object componentNameResolver);

  private native void installJSIBindings();
}
