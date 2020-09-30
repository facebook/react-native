/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.devsupport.JSDevSupport;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import java.util.ArrayList;
import java.util.List;
import javax.inject.Provider;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(
    nativeModules = {
      JSCHeapCapture.class,
      JSDevSupport.class,
    })
/* package */ class DebugCorePackage extends LazyReactPackage {

  DebugCorePackage() {}

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            JSCHeapCapture.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new JSCHeapCapture(reactContext);
              }
            }));
    return moduleSpecList;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
  }
}
