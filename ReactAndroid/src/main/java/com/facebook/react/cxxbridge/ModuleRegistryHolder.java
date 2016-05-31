/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import java.util.Collection;

import com.facebook.jni.HybridData;

public class ModuleRegistryHolder {
  private final HybridData mHybridData;
  private static native HybridData initHybrid(
    CatalystInstanceImpl catalystInstanceImpl,
    Collection<JavaModuleWrapper> javaModules,
    Collection<CxxModuleWrapper> cxxModules);

  public ModuleRegistryHolder(CatalystInstanceImpl catalystInstanceImpl,
                              Collection<JavaModuleWrapper> javaModules,
                              Collection<CxxModuleWrapper> cxxModules) {
    mHybridData = initHybrid(catalystInstanceImpl, javaModules, cxxModules);
  }
}
