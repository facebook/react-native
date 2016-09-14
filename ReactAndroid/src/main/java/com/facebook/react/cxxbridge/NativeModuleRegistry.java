/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.common.MapBuilder;
import com.facebook.systrace.Systrace;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {
  private final Map<Class<NativeModule>, NativeModule> mModuleInstances;
  private final ArrayList<OnBatchCompleteListener> mBatchCompleteListenerModules;

  private NativeModuleRegistry(Map<Class<NativeModule>, NativeModule> moduleInstances) {
    mModuleInstances = moduleInstances;
    mBatchCompleteListenerModules = new ArrayList<OnBatchCompleteListener>(mModuleInstances.size());
    for (NativeModule module : mModuleInstances.values()) {
      if (module instanceof OnBatchCompleteListener) {
        mBatchCompleteListenerModules.add((OnBatchCompleteListener) module);
      }
    }
  }

  /* package */ ModuleRegistryHolder getModuleRegistryHolder(
      CatalystInstanceImpl catalystInstanceImpl) {
    ArrayList<JavaModuleWrapper> javaModules = new ArrayList<>();
    ArrayList<CxxModuleWrapper> cxxModules = new ArrayList<>();
    for (NativeModule module : mModuleInstances.values()) {
      if (module instanceof BaseJavaModule) {
        javaModules.add(new JavaModuleWrapper(catalystInstanceImpl, (BaseJavaModule) module));
      } else if (module instanceof CxxModuleWrapper) {
        cxxModules.add((CxxModuleWrapper) module);
      } else {
        throw new IllegalArgumentException("Unknown module type " + module.getClass());
      }
    }
    return new ModuleRegistryHolder(catalystInstanceImpl, javaModules, cxxModules);
  }

  /* package */ void notifyCatalystInstanceDestroy() {
    UiThreadUtil.assertOnUiThread();
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyCatalystInstanceDestroy");
    try {
      for (NativeModule nativeModule : mModuleInstances.values()) {
        nativeModule.onCatalystInstanceDestroy();
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /* package */ void notifyCatalystInstanceInitialized() {
    UiThreadUtil.assertOnUiThread();

    ReactMarker.logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_START);
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyCatalystInstanceInitialized");
    try {
      for (NativeModule nativeModule : mModuleInstances.values()) {
        nativeModule.initialize();
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_END);
    }
  }

  public void onBatchComplete() {
    for (int i = 0; i < mBatchCompleteListenerModules.size(); i++) {
      mBatchCompleteListenerModules.get(i).onBatchComplete();
    }
  }

  public <T extends NativeModule> boolean hasModule(Class<T> moduleInterface) {
    return mModuleInstances.containsKey(moduleInterface);
  }

  public <T extends NativeModule> T getModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(mModuleInstances.get(moduleInterface));
  }

  public Collection<NativeModule> getAllModules() {
    return mModuleInstances.values();
  }

  public static class Builder {
    private final HashMap<String, NativeModule> mModules = MapBuilder.newHashMap();

    public Builder add(NativeModule module) {
      NativeModule existing = mModules.get(module.getName());
      if (existing != null && !module.canOverrideExistingModule()) {
        throw new IllegalStateException("Native module " + module.getClass().getSimpleName() +
            " tried to override " + existing.getClass().getSimpleName() + " for module name " +
            module.getName() + ". If this was your intention, return true from " +
            module.getClass().getSimpleName() + "#canOverrideExistingModule()");
      }
      mModules.put(module.getName(), module);
      return this;
    }

    public NativeModuleRegistry build() {
      Map<Class<NativeModule>, NativeModule> moduleInstances = new HashMap<>();
      for (NativeModule module : mModules.values()) {
        moduleInstances.put((Class<NativeModule>) module.getClass(), module);
      }
      return new NativeModuleRegistry(moduleInstances);
    }
  }
}
