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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * {@code CompositeReactPackage} allows to create a single package composed of views and modules
 * from several other packages.
 */
public class CompositeReactPackage implements ReactPackage {

  private final List<ReactPackage> mChildReactPackages = new ArrayList<>();

  /**
   * The order in which packages are passed matters. It may happen that a NativeModule or
   * or a ViewManager exists in two or more ReactPackages. In that case the latter will win
   * i.e. the latter will overwrite the former. This re-occurrence is detected by
   * comparing a name of a module.
   */
  public CompositeReactPackage(ReactPackage arg1, ReactPackage arg2, ReactPackage... args) {
    mChildReactPackages.add(arg1);
    mChildReactPackages.add(arg2);

    for (ReactPackage reactPackage: args) {
      mChildReactPackages.add(reactPackage);
    }
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    final Map<String, NativeModule> moduleMap = new HashMap<>();
    for (ReactPackage reactPackage: mChildReactPackages) {
      for (NativeModule nativeModule: reactPackage.createNativeModules(reactContext)) {
        moduleMap.put(nativeModule.getName(), nativeModule);
      }
    }
    return new ArrayList(moduleMap.values());
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    final Set<Class<? extends JavaScriptModule>> moduleSet = new HashSet<>();
    for (ReactPackage reactPackage: mChildReactPackages) {
      for (Class<? extends JavaScriptModule> jsModule: reactPackage.createJSModules()) {
        moduleSet.add(jsModule);
      }
    }
    return new ArrayList(moduleSet);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    final Map<String, ViewManager> viewManagerMap = new HashMap<>();
    for (ReactPackage reactPackage: mChildReactPackages) {
      for (ViewManager viewManager: reactPackage.createViewManagers(reactContext)) {
        viewManagerMap.put(viewManager.getName(), viewManager);
      }
    }
    return new ArrayList(viewManagerMap.values());
  }
}
