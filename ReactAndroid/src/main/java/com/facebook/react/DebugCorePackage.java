/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.inject.Provider;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.devsupport.JSCSamplingProfiler;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(
  nativeModules = {
    JSCHeapCapture.class,
    JSCSamplingProfiler.class,
  }
)
/* package */ class DebugCorePackage extends LazyReactPackage {

  DebugCorePackage() {
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();
    moduleSpecList.add(
      new ModuleSpec(JSCHeapCapture.class, new Provider<NativeModule>() {
          @Override
          public NativeModule get() {
            return new JSCHeapCapture(reactContext);
          }
        }));
    moduleSpecList.add(
      new ModuleSpec(JSCSamplingProfiler.class, new Provider<NativeModule>() {
          @Override
          public NativeModule get() {
            return new JSCSamplingProfiler(reactContext);
          }
        }));
    return moduleSpecList;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
  }
}
