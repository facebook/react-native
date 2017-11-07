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
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_START;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.devsupport.JSCSamplingProfiler;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule;
import com.facebook.react.modules.core.Timing;
import com.facebook.react.modules.debug.AnimationsDebugModule;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;
import javax.inject.Provider;
/**
 * This module should be removed following the completion of an experiment into splitting this into
 * three modules to allow for more light-weight instantiations of the bridge without UIManager
 * The core modules are now in BridgeCorePackage
 * The debug modules are now in DebugCorePackage
 * The UI manager is in ReactNativeCorePackage
 *
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(
  nativeModules = {
    AndroidInfoModule.class,
    AnimationsDebugModule.class,
    DeviceEventManagerModule.class,
    ExceptionsManagerModule.class,
    HeadlessJsTaskSupportModule.class,
    SourceCodeModule.class,
    Timing.class,
    UIManagerModule.class,
    DeviceInfoModule.class,
    // Debug only
    JSCHeapCapture.class,
    JSCSamplingProfiler.class,
  }
)
/* package */ class CoreModulesPackage extends LazyReactPackage implements ReactPackageLogger {

  private final ReactInstanceManager mReactInstanceManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;
  private final UIImplementationProvider mUIImplementationProvider;
  private final boolean mLazyViewManagersEnabled;
  private final int mMinTimeLeftInFrameForNonBatchedOperationMs;

  CoreModulesPackage(
      ReactInstanceManager reactInstanceManager,
      DefaultHardwareBackBtnHandler hardwareBackBtnHandler,
      UIImplementationProvider uiImplementationProvider,
      boolean lazyViewManagersEnabled,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mReactInstanceManager = reactInstanceManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
    mUIImplementationProvider = uiImplementationProvider;
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();

    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            AndroidInfoModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new AndroidInfoModule();
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            AnimationsDebugModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new AnimationsDebugModule(
                    reactContext, mReactInstanceManager.getDevSupportManager().getDevSettings());
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            DeviceEventManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            ExceptionsManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager());
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            HeadlessJsTaskSupportModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new HeadlessJsTaskSupportModule(reactContext);
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            SourceCodeModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new SourceCodeModule(reactContext);
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            Timing.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new Timing(reactContext, mReactInstanceManager.getDevSupportManager());
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            UIManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return createUIManager(reactContext);
              }
            }));
    moduleSpecList.add(
        ModuleSpec.nativeModuleSpec(
            DeviceInfoModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new DeviceInfoModule(reactContext);
              }
            }));

    if (ReactBuildConfig.DEBUG) {
      moduleSpecList.add(
          ModuleSpec.nativeModuleSpec(
              JSCHeapCapture.class,
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new JSCHeapCapture(reactContext);
                }
              }));
      moduleSpecList.add(
          ModuleSpec.nativeModuleSpec(
              JSCSamplingProfiler.class,
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new JSCSamplingProfiler(reactContext);
                }
              }));
    }

    return moduleSpecList;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    // This has to be done via reflection or we break open source.
    return LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
  }

  private UIManagerModule createUIManager(final ReactApplicationContext reactContext) {
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START);
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");
    try {
      if (mLazyViewManagersEnabled) {
        UIManagerModule.ViewManagerResolver resolver = new UIManagerModule.ViewManagerResolver() {
          @Override
          public @Nullable ViewManager getViewManager(String viewManagerName) {
            return mReactInstanceManager.createViewManager(viewManagerName);
          }
          @Override
          public List<String> getViewManagerNames() {
            return mReactInstanceManager.getViewManagerNames();
          }
        };

        return new UIManagerModule(
            reactContext,
            resolver,
            mUIImplementationProvider,
            mMinTimeLeftInFrameForNonBatchedOperationMs);
      } else {
        return new UIManagerModule(
            reactContext,
            mReactInstanceManager.createAllViewManagers(reactContext),
            mUIImplementationProvider,
            mMinTimeLeftInFrameForNonBatchedOperationMs);
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END);
    }
  }

  @Override
  public void startProcessPackage() {
    ReactMarker.logMarker(PROCESS_CORE_REACT_PACKAGE_START);
  }

  @Override
  public void endProcessPackage() {
    ReactMarker.logMarker(PROCESS_CORE_REACT_PACKAGE_END);
  }
}
