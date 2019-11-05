/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ModuleHolder;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.systrace.SystraceMessage;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * React package supporting lazy creation of native modules.
 *
 * <p>TODO(t11394819): Make this default and deprecate ReactPackage
 */
public abstract class LazyReactPackage implements ReactPackage {

  public static ReactModuleInfoProvider getReactModuleInfoProviderViaReflection(
      LazyReactPackage lazyReactPackage) {
    Class<?> reactModuleInfoProviderClass;
    try {
      reactModuleInfoProviderClass =
          Class.forName(
              lazyReactPackage.getClass().getCanonicalName() + "$$ReactModuleInfoProvider");
    } catch (ClassNotFoundException e) {
      // In OSS case, when the annotation processor does not run, we fall back to non-lazy mode
      // For this, we simply return an empty moduleMap.
      // NativeModuleRegistryBuilder will eagerly get all the modules, and get the info from the
      // modules directly
      return new ReactModuleInfoProvider() {
        @Override
        public Map<String, ReactModuleInfo> getReactModuleInfos() {
          return Collections.emptyMap();
        }
      };
    }

    if (reactModuleInfoProviderClass == null) {
      throw new RuntimeException(
          "ReactModuleInfoProvider class for "
              + lazyReactPackage.getClass().getCanonicalName()
              + " not found.");
    }

    try {
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "Unable to instantiate ReactModuleInfoProvider for " + lazyReactPackage.getClass(), e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "Unable to instantiate ReactModuleInfoProvider for " + lazyReactPackage.getClass(), e);
    }
  }

  /**
   * We return an iterable
   *
   * @param reactContext
   * @return
   */
  public Iterable<ModuleHolder> getNativeModuleIterator(
      final ReactApplicationContext reactContext) {
    final Map<String, ReactModuleInfo> reactModuleInfoMap =
        getReactModuleInfoProvider().getReactModuleInfos();
    final List<ModuleSpec> nativeModules = getNativeModules(reactContext);

    return new Iterable<ModuleHolder>() {
      @NonNull
      @Override
      public Iterator<ModuleHolder> iterator() {
        return new Iterator<ModuleHolder>() {
          int position = 0;

          @Override
          public ModuleHolder next() {
            ModuleSpec moduleSpec = nativeModules.get(position++);
            String name = moduleSpec.getName();
            ReactModuleInfo reactModuleInfo = reactModuleInfoMap.get(name);
            ModuleHolder moduleHolder;
            if (reactModuleInfo == null) {
              NativeModule module;
              ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, name);
              try {
                module = moduleSpec.getProvider().get();
              } finally {
                ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END);
              }
              moduleHolder = new ModuleHolder(module);
            } else {
              moduleHolder = new ModuleHolder(reactModuleInfo, moduleSpec.getProvider());
            }
            return moduleHolder;
          }

          @Override
          public boolean hasNext() {
            return position < nativeModules.size();
          }

          @Override
          public void remove() {
            throw new UnsupportedOperationException("Cannot remove native modules from the list");
          }
        };
      }
    };
  }

  /**
   * @param reactContext react application context that can be used to create modules
   * @return list of module specs that can create the native modules
   */
  protected abstract List<ModuleSpec> getNativeModules(ReactApplicationContext reactContext);

  /**
   * This is only used when a LazyReactPackage is a part of {@link CompositeReactPackage} Once we
   * deprecate {@link CompositeReactPackage}, this can be removed too
   *
   * @param reactContext react application context that can be used to create modules
   * @return
   */
  @Override
  public final List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    for (ModuleSpec holder : getNativeModules(reactContext)) {
      NativeModule nativeModule;
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createNativeModule")
          .arg("module", holder.getType())
          .flush();
      ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, holder.getName());
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
