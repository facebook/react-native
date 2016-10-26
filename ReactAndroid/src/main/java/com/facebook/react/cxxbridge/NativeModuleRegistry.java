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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.util.Pair;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.systrace.Systrace;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {

  private final Map<Class<? extends NativeModule>, ModuleHolder> mModules;
  private final ArrayList<OnBatchCompleteListener> mBatchCompleteListenerModules;

  public NativeModuleRegistry(
    List<ModuleSpec> moduleSpecList,
    Map<Class, ReactModuleInfo> reactModuleInfoMap) {
    Map<String, Pair<Class<? extends NativeModule>, ModuleHolder>> namesToSpecs = new HashMap<>();
    for (ModuleSpec module : moduleSpecList) {
      Class<? extends NativeModule> type = module.getType();
      ModuleHolder holder = new ModuleHolder(
        type,
        reactModuleInfoMap.get(type),
        module.getProvider());
      String name = holder.getInfo().name();
      Class<? extends NativeModule> existing = namesToSpecs.containsKey(name) ?
        namesToSpecs.get(name).first :
        null;
      if (existing != null && !holder.getInfo().canOverrideExistingModule()) {
        throw new IllegalStateException("Native module " + type.getSimpleName() +
          " tried to override " + existing.getSimpleName() + " for module name " + name +
          ". If this was your intention, set canOverrideExistingModule=true");
      }
      namesToSpecs.put(name, new Pair<Class<? extends NativeModule>, ModuleHolder>(type, holder));
    }

    mModules = new HashMap<>();
    for (Pair<Class<? extends NativeModule>, ModuleHolder> pair : namesToSpecs.values()) {
      mModules.put(pair.first, pair.second);
    }

    mBatchCompleteListenerModules = new ArrayList<>();
    for (Class<? extends NativeModule> type : mModules.keySet()) {
      if (OnBatchCompleteListener.class.isAssignableFrom(type)) {
        final ModuleHolder holder = mModules.get(type);
        mBatchCompleteListenerModules.add(new OnBatchCompleteListener() {
          @Override
          public void onBatchComplete() {
            OnBatchCompleteListener listener = (OnBatchCompleteListener) holder.getModule();
            listener.onBatchComplete();
          }
        });
      }
    }
  }

  /* package */ ModuleRegistryHolder getModuleRegistryHolder(
    CatalystInstanceImpl catalystInstanceImpl) {
    ArrayList<JavaModuleWrapper> javaModules = new ArrayList<>();
    ArrayList<CxxModuleWrapper> cxxModules = new ArrayList<>();
    for (Map.Entry<Class<? extends NativeModule>, ModuleHolder> entry : mModules.entrySet()) {
      Class<?> type = entry.getKey();
      ModuleHolder moduleHolder = entry.getValue();
      if (BaseJavaModule.class.isAssignableFrom(type)) {
        javaModules.add(new JavaModuleWrapper(catalystInstanceImpl, moduleHolder));
      } else if (CxxModuleWrapper.class.isAssignableFrom(type)) {
        cxxModules.add((CxxModuleWrapper) moduleHolder.getModule());
      } else {
        throw new IllegalArgumentException("Unknown module type " + type);
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
      for (ModuleHolder module : mModules.values()) {
        module.destroy();
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
      for (ModuleHolder module : mModules.values()) {
        module.initialize();
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
    return mModules.containsKey(moduleInterface);
  }

  public <T extends NativeModule> T getModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(mModules.get(moduleInterface)).getModule();
  }

  public List<NativeModule> getAllModules() {
    List<NativeModule> modules = new ArrayList<>();
    for (ModuleHolder module : mModules.values()) {
      modules.add(module.getModule());
    }
    return modules;
  }
}
