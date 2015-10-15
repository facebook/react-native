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
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.SetBuilder;
import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {

  private final ArrayList<ModuleDefinition> mModuleTable;
  private final Map<Class<NativeModule>, NativeModule> mModuleInstances;
  private final String mModuleDescriptions;
  private final ArrayList<OnBatchCompleteListener> mBatchCompleteListenerModules;

  private NativeModuleRegistry(
      ArrayList<ModuleDefinition> moduleTable,
      Map<Class<NativeModule>, NativeModule> moduleInstances,
      String moduleDescriptions) {
    mModuleTable = moduleTable;
    mModuleInstances = moduleInstances;
    mModuleDescriptions = moduleDescriptions;

    mBatchCompleteListenerModules = new ArrayList<OnBatchCompleteListener>(mModuleTable.size());
    for (int i = 0; i < mModuleTable.size(); i++) {
      ModuleDefinition definition = mModuleTable.get(i);
      if (definition.target instanceof OnBatchCompleteListener) {
        mBatchCompleteListenerModules.add((OnBatchCompleteListener) definition.target);
      }
    }
  }

  /* package */ void call(
      CatalystInstance catalystInstance,
      int moduleId,
      int methodId,
      ReadableNativeArray parameters) {
    ModuleDefinition definition = mModuleTable.get(moduleId);
    if (definition == null) {
      throw new RuntimeException("Call to unknown module: " + moduleId);
    }
    definition.call(catalystInstance, methodId, parameters);
  }

  /* package */ String moduleDescriptions() {
    return mModuleDescriptions;
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

  public void onBatchComplete() {
    for (int i = 0; i < mBatchCompleteListenerModules.size(); i++) {
      mBatchCompleteListenerModules.get(i).onBatchComplete();
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
        int methodId,
        ReadableNativeArray parameters) {
      MethodRegistration method = this.methods.get(methodId);
      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, method.tracingName);
      try {
        this.methods.get(methodId).method.invoke(catalystInstance, parameters);
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

    private ArrayList<ModuleDefinition> mModuleDefinitions;
    private Map<Class<NativeModule>, NativeModule> mModuleInstances;
    private Set<String> mSeenModuleNames;

    public Builder() {
      mModuleDefinitions = new ArrayList<ModuleDefinition>();
      mModuleInstances = MapBuilder.newHashMap();
      mSeenModuleNames = SetBuilder.newHashSet();
    }

    public Builder add(NativeModule module) {
      ModuleDefinition registration = new ModuleDefinition(
          mModuleDefinitions.size(),
          module.getName(),
          module);
      Assertions.assertCondition(
          !mSeenModuleNames.contains(module.getName()),
          "Module " + module.getName() + " was already registered!");
      mSeenModuleNames.add(module.getName());
      mModuleDefinitions.add(registration);
      mModuleInstances.put((Class<NativeModule>) module.getClass(), module);
      return this;
    }

    public NativeModuleRegistry build() {
      JsonFactory jsonFactory = new JsonFactory();
      StringWriter writer = new StringWriter();
      try {
        JsonGenerator jg = jsonFactory.createGenerator(writer);
        jg.writeStartObject();
        for (ModuleDefinition module : mModuleDefinitions) {
          jg.writeObjectFieldStart(module.name);
          jg.writeNumberField("moduleID", module.id);
          jg.writeObjectFieldStart("methods");
          for (int i = 0; i < module.methods.size(); i++) {
            MethodRegistration method = module.methods.get(i);
            jg.writeObjectFieldStart(method.name);
            jg.writeNumberField("methodID", i);
            jg.writeEndObject();
          }
          jg.writeEndObject();
          module.target.writeConstantsField(jg, "constants");
          jg.writeEndObject();
        }
        jg.writeEndObject();
        jg.close();
      } catch (IOException ioe) {
        throw new RuntimeException("Unable to serialize Java module configuration", ioe);
      }
      String moduleDefinitionJson = writer.getBuffer().toString();
      return new NativeModuleRegistry(mModuleDefinitions, mModuleInstances, moduleDefinitionJson);
    }
  }
}
