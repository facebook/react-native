/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class CoreComponentsRegistry extends ComponentRegistry {
  static {
    SoLoader.loadLibrary("fabricjni");
  }

  private CoreComponentsRegistry(ComponentFactory componentFactory) {
    super(componentFactory);
  }

  public static CoreComponentsRegistry register(ComponentFactory componentFactory) {
    return new CoreComponentsRegistry(componentFactory);
  }
}
