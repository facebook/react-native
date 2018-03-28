/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * React package supporting lazy creation of native modules.
 *
 * TODO(t11394819): Make this default and deprecate ReactPackage
 */
public abstract class LazyReactPackage implements ReactPackage {

  public static ReactModuleInfoProvider getReactModuleInfoProviderViaReflection(
      LazyReactPackage lazyReactPackage) {
    Class<?> reactModuleInfoProviderClass;
    try {
      reactModuleInfoProviderClass = Class.forName(
          lazyReactPackage.getClass().getCanonicalName() + "$$ReactModuleInfoProvider");
    } catch (ClassNotFoundException e) {
      throw new RuntimeException(e);
    }

    if (reactModuleInfoProviderClass == null) {
      throw new RuntimeException("ReactModuleInfoProvider class for " +
          lazyReactPackage.getClass().getCanonicalName() + " not found.");
    }

    try {
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "Unable to instantiate ReactModuleInfoProvider for " + lazyReactPackage.getClass(),
          e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "Unable to instantiate ReactModuleInfoProvider for " + lazyReactPackage.getClass(),
          e);
    }
  }

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
      NativeModule nativeModule;
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createNativeModule")
        .arg("module", holder.getType())
        .flush();
      ReactMarker.logMarker(
        ReactMarkerConstants.CREATE_MODULE_START,
        holder.getType().getSimpleName());
      try {
        nativeModule = holder.getProvider().get();
      } finally {
        ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END);
        SystraceMessage.endSection(TRACE_TAG_REACT_JAVA_BRIDGE).flush();
      }
      modules.add(nativeModule);
    }
    return modules;
  }

  /**
   * @param reactContext react application context that can be used to create View Managers.
   * @return list of module specs that can create the View Managers.
   */
  public List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ModuleSpec> viewManagerModuleSpecs = getViewManagers(reactContext);
    if (viewManagerModuleSpecs == null || viewManagerModuleSpecs.isEmpty()) {
      return Collections.emptyList();
    }

    List<ViewManager> viewManagers = new ArrayList<>();
    for (ModuleSpec moduleSpec : viewManagerModuleSpecs) {
      viewManagers.add((ViewManager) moduleSpec.getProvider().get());
    }
    return viewManagers;
  }

  public abstract ReactModuleInfoProvider getReactModuleInfoProvider();
}
