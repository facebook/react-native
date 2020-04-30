/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ModuleHolder;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import javax.inject.Provider;

/** This will eventually replace {@link LazyReactPackage} when TurboModules are finally done. */
public abstract class TurboReactPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    throw new UnsupportedOperationException(
        "In case of TurboModules, createNativeModules is not supported. NativeModuleRegistry should instead use getModuleList or getModule method");
  }

  /**
   * The API needed for TurboModules. Given a module name, it returns an instance of {@link
   * NativeModule} for the name
   *
   * @param name
   * @param reactContext
   * @return
   */
  public abstract NativeModule getModule(String name, final ReactApplicationContext reactContext);

  /**
   * This is a temporary method till we implement TurboModules. Once we implement TurboModules, we
   * will be able to directly call {@link TurboReactPackage#getModule(String,
   * ReactApplicationContext)} This method will be removed when TurboModule implementation is
   * complete
   *
   * @param reactContext
   * @return
   */
  public Iterable<ModuleHolder> getNativeModuleIterator(
      final ReactApplicationContext reactContext) {
    final Set<Map.Entry<String, ReactModuleInfo>> entrySet =
        getReactModuleInfoProvider().getReactModuleInfos().entrySet();
    final Iterator<Map.Entry<String, ReactModuleInfo>> entrySetIterator = entrySet.iterator();
    return new Iterable<ModuleHolder>() {
      @NonNull
      @Override
      // This should ideally be an IteratorConvertor, but we don't have any internal library for it
      public Iterator<ModuleHolder> iterator() {
        return new Iterator<ModuleHolder>() {
          Map.Entry<String, ReactModuleInfo> nextEntry = null;

          private void findNext() {
            while (entrySetIterator.hasNext()) {
              Map.Entry<String, ReactModuleInfo> entry = entrySetIterator.next();
              ReactModuleInfo reactModuleInfo = entry.getValue();

              // This Iterator is used to create the NativeModule registry. The NativeModule
              // registry must not have TurboModules. Therefore, if TurboModules are enabled, and
              // the current NativeModule is a TurboModule, we need to skip iterating over it.
              if (ReactFeatureFlags.useTurboModules && reactModuleInfo.isTurboModule()) {
                continue;
              }

              nextEntry = entry;
              return;
            }
            nextEntry = null;
          }

          @Override
          public boolean hasNext() {
            if (nextEntry == null) {
              findNext();
            }
            return nextEntry != null;
          }

          @Override
          public ModuleHolder next() {
            if (nextEntry == null) {
              findNext();
            }

            if (nextEntry == null) {
              throw new NoSuchElementException("ModuleHolder not found");
            }

            Map.Entry<String, ReactModuleInfo> entry = nextEntry;

            // Advance iterator
            findNext();
            String name = entry.getKey();
            ReactModuleInfo reactModuleInfo = entry.getValue();
            return new ModuleHolder(reactModuleInfo, new ModuleHolderProvider(name, reactContext));
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
   * @param reactContext react application context that can be used to create View Managers.
   * @return list of module specs that can create the View Managers.
   */
  protected List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
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

  private class ModuleHolderProvider implements Provider<NativeModule> {

    private final String mName;
    private final ReactApplicationContext mReactContext;

    public ModuleHolderProvider(String name, ReactApplicationContext reactContext) {
      mName = name;
      mReactContext = reactContext;
    }

    @Override
    public NativeModule get() {
      return getModule(mName, mReactContext);
    }
  }
}
