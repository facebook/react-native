/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule;
import com.facebook.react.modules.core.Timing;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.systrace.Systrace;
import java.util.Arrays;
import java.util.List;
import javax.annotation.Nullable;
import javax.inject.Provider;

/**
 * This is the basic module to support React Native. The debug modules are now in DebugCorePackage.
 */
@ReactModuleList(
  nativeModules = {
    AndroidInfoModule.class,
    DeviceEventManagerModule.class,
    DeviceInfoModule.class,
    ExceptionsManagerModule.class,
    HeadlessJsTaskSupportModule.class,
    SourceCodeModule.class,
    Timing.class,
    UIManagerModule.class,
  }
)
/* package */ class CoreModulesPackage extends LazyReactPackage implements ReactPackageLogger {

  private final ReactInstanceManager mReactInstanceManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;
  private final boolean mLazyViewManagersEnabled;
  private final int mMinTimeLeftInFrameForNonBatchedOperationMs;

  CoreModulesPackage(
      ReactInstanceManager reactInstanceManager,
      DefaultHardwareBackBtnHandler hardwareBackBtnHandler,
      @Nullable UIImplementationProvider uiImplementationProvider,
      boolean lazyViewManagersEnabled,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mReactInstanceManager = reactInstanceManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    return Arrays.asList(
        ModuleSpec.nativeModuleSpec(
            AndroidInfoModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new AndroidInfoModule(reactContext);
              }
            }),
        ModuleSpec.nativeModuleSpec(
            DeviceEventManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
              }
            }),
        ModuleSpec.nativeModuleSpec(
            ExceptionsManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager());
              }
            }),
        ModuleSpec.nativeModuleSpec(
            HeadlessJsTaskSupportModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new HeadlessJsTaskSupportModule(reactContext);
              }
            }),
        ModuleSpec.nativeModuleSpec(
            SourceCodeModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new SourceCodeModule(reactContext);
              }
            }),
        ModuleSpec.nativeModuleSpec(
            Timing.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new Timing(reactContext, mReactInstanceManager.getDevSupportManager());
              }
            }),
        ModuleSpec.nativeModuleSpec(
            UIManagerModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return createUIManager(reactContext);
              }
            }),
        ModuleSpec.nativeModuleSpec(
            DeviceInfoModule.class,
            new Provider<NativeModule>() {
              @Override
              public NativeModule get() {
                return new DeviceInfoModule(reactContext);
              }
            }));
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
            mMinTimeLeftInFrameForNonBatchedOperationMs);
      } else {
        return new UIManagerModule(
            reactContext,
            mReactInstanceManager.getOrCreateViewManagers(reactContext),
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
