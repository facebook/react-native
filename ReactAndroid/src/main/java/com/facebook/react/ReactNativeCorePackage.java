/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.List;
import javax.inject.Provider;

/**
 * Package defining core framework modules for initializing ReactNative (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(
  nativeModules = {
    UIManagerModule.class,
  }
)
public class ReactNativeCorePackage extends LazyReactPackage {

  private final ReactInstanceManager mReactInstanceManager;
  private final UIImplementationProvider mUIImplementationProvider;
  private final boolean mLazyViewManagersEnabled;
  private final int mMinTimeLeftInFrameForNonBatchedOperationMs;

  public ReactNativeCorePackage(
      ReactInstanceManager reactInstanceManager,
      UIImplementationProvider uiImplementationProvider,
      boolean lazyViewManagersEnabled,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mReactInstanceManager = reactInstanceManager;
    mUIImplementationProvider = uiImplementationProvider;
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();

    moduleSpecList.add(
      new ModuleSpec(UIManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return createUIManager(reactContext);
        }
      }));

    return moduleSpecList;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    // This has to be done via reflection or we break open source.
    ReactModuleInfoProvider reactModuleInfoProvider =
      LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
    return reactModuleInfoProvider;
  }

  private UIManagerModule createUIManager(ReactApplicationContext reactContext) {
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START);
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");
    try {
      List<ViewManager> viewManagersList = mReactInstanceManager.createAllViewManagers(
        reactContext);
      return new UIManagerModule(
          reactContext,
          viewManagersList,
          mUIImplementationProvider,
          mLazyViewManagersEnabled,
          mMinTimeLeftInFrameForNonBatchedOperationMs);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END);
    }
  }
}
