/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * React package supporting lazy creation of native modules.
 *
 * TODO(t11394819): Make this default and deprecate ReactPackage
 */
public abstract class LazyReactPackage implements ReactPackage {
  /**
   * @param reactContext react application context that can be used to create modules
   * @return list of module specs that can create the native modules
   */
  public abstract List<ModuleSpec> getNativeModules(
    ReactApplicationContext reactContext);

  @Override
  public final List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    for (ModuleSpec holder : getNativeModules(reactContext)) {
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createNativeModule")
        .arg("module", holder.getType())
        .flush();
      try {
        modules.add(holder.getProvider().get());
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
    return modules;
  }
}
