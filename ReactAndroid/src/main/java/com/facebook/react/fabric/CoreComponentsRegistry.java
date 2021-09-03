/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class CoreComponentsRegistry extends ComponentRegistry {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip
  private static native HybridData initHybrid();

  @DoNotStrip
  private CoreComponentsRegistry(ComponentFactory componentFactory) {
    super(componentFactory);
  }

  @DoNotStrip
  public static CoreComponentsRegistry register(ComponentFactory componentFactory) {
    return new CoreComponentsRegistry(componentFactory);
  }
}
