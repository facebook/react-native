/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.facebook.react.common.MapBuilder;
import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {

  private final List<ModuleDefinition> mModuleTable;
  private final Map<Class<? extends NativeModule>, NativeModule> mModuleInstances;
  private final ArrayList<OnBatchCompleteListener> mBatchCompleteListenerModules;
  private final ArrayList<OnExecutorUnregisteredListener> mOnExecutorUnregisteredListenerModules;

  private NativeModuleRegistry(
      List<ModuleDefinition> moduleTable,
      Map<Class<? extends NativeModule>, NativeModule> moduleInstances) {
    mModuleTable = moduleTable;
    mModuleInstances = moduleInstances;

    mBatchCompleteListenerModules = new ArrayList<>(mModuleTable.size());
    mOnExecutorUnregisteredListenerModules = new ArrayList<>(mModuleTable.size());
    for (int i = 0; i < mModuleTable.size(); i++) {
      ModuleDefinition definition = mModuleTable.get(i);
      if (definition.target instanceof OnBatchCompleteListener) {
        mBatchCompleteListenerModules.add((OnBatchCompleteListener) definition.target);
      }
      if (definition.target instanceof OnExecutorUnregisteredListener) {
        mOnExecutorUnregisteredListenerModules.add((OnExecutorUnregisteredListener) definition.target);
      }
    }
  }

  /* package */ void call(
      CatalystInstance catalystInstance,
      ExecutorToken executorToken,
      int moduleId,
      int methodId,
      ReadableNativeArray parameters) {
    ModuleDefinition definition = mModuleTable.get(moduleId);
    if (definition == null) {
      throw new RuntimeException("Call to unknown module: " + moduleId);
    }
    definition.call(catalystInstance, executorToken, methodId, parameters);
  }

  /* package */ void writeModuleDescriptions(JsonWriter writer) throws IOException {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "CreateJSON");
    try {
      writer.beginObject();
      for (ModuleDefinition moduleDef : mModuleTable) {
        writer.name(moduleDef.name).beginObject();
        writer.name("moduleID").value(moduleDef.id);
        writer.name("supportsWebWorkers").value(moduleDef.target.supportsWebWorkers());
        writer.name("methods").beginObject();
        for (int i = 0; i < moduleDef.methods.size(); i++) {
          MethodRegistration method = moduleDef.methods.get(i);
          writer.name(method.name).beginObject();
          writer.name("methodID").value(i);
          writer.name("type").value(method.method.getType());
          writer.endObject();
        }
        writer.endObject();
        moduleDef.target.writeConstantsField(writer, "constants");
        writer.endObject();
      }
      writer.endObject();
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
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

    ReactMarker.logMarker("NativeModule_start");
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyCatalystInstanceInitialized");
    try {
      for (NativeModule nativeModule : mModuleInstances.values()) {
        nativeModule.initialize();
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker("NativeModule_end");
    }
  }

  /* package */ void notifyReactBridgeInitialized(ReactBridge bridge) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyReactBridgeInitialized");
    try {
      for (NativeModule nativeModule : mModuleInstances.values()) {
        nativeModule.onReactBridgeInitialized(bridge);
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  public void onBatchComplete() {
    for (int i = 0; i < mBatchCompleteListenerModules.size(); i++) {
      mBatchCompleteListenerModules.get(i).onBatchComplete();
    }
  }

  public void onExecutorUnregistered(ExecutorToken executorToken) {
    for (int i = 0; i < mOnExecutorUnregisteredListenerModules.size(); i++) {
      mOnExecutorUnregisteredListenerModules.get(i).onExecutorDestroyed(executorToken);
    }
  }

  public <T extends NativeModule> T getModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(mModuleInstances.get(moduleInterface));
  }

  public Collection<NativeModule> getAllModules() {
    return mModuleInstances.values();
  }

  private static class ModuleDefinition {
    public final int id;
    public final String name;
    public final NativeModule target;
    public final ArrayList<MethodRegistration> methods;

    public ModuleDefinition(int id, String name, NativeModule target) {
      this.id = id;
      this.name = name;
      this.target = target;
      this.methods = new ArrayList<MethodRegistration>();

      for (Map.Entry<String, NativeModule.NativeMethod> entry : target.getMethods().entrySet()) {
        this.methods.add(
          new MethodRegistration(
            entry.getKey(), "NativeCall__" + target.getName() + "_" + entry.getKey(),
            entry.getValue()));
      }
    }

    public void call(
        CatalystInstance catalystInstance,
        ExecutorToken executorToken,
        int methodId,
        ReadableNativeArray parameters) {
      MethodRegistration method = this.methods.get(methodId);
      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, method.tracingName);
      try {
        this.methods.get(methodId).method.invoke(catalystInstance, executorToken, parameters);
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
  }

  private static class MethodRegistration {
    public MethodRegistration(String name, String tracingName, NativeModule.NativeMethod method) {
      this.name = name;
      this.tracingName = tracingName;
      this.method = method;
    }

    public String name;
    public String tracingName;
    public NativeModule.NativeMethod method;
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
      List<ModuleDefinition> moduleTable = new ArrayList<>();
      Map<Class<? extends NativeModule>, NativeModule> moduleInstances = new HashMap<>();

      int idx = 0;
      for (NativeModule module : mModules.values()) {
        ModuleDefinition moduleDef = new ModuleDefinition(idx++, module.getName(), module);
        moduleTable.add(moduleDef);
        moduleInstances.put(module.getClass(), module);
      }
      return new NativeModuleRegistry(moduleTable, moduleInstances);
    }
  }
}
