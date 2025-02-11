/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START;
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_START;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.common.ClassFinder;
import com.facebook.react.devsupport.LogBoxModule;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule;
import com.facebook.react.modules.core.TimingModule;
import com.facebook.react.modules.debug.DevMenuModule;
import com.facebook.react.modules.debug.DevSettingsModule;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerResolver;
import com.facebook.systrace.Systrace;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * This is the basic module to support React Native. The debug modules are now in DebugCorePackage.
 */
@ReactModuleList(
    // WARNING: If you modify this list, ensure that the list below in method
    // getReactModuleInfoByInitialization is also updated
    nativeModules = {
      AndroidInfoModule.class,
      DeviceEventManagerModule.class,
      DeviceInfoModule.class,
      DevMenuModule.class,
      DevSettingsModule.class,
      ExceptionsManagerModule.class,
      LogBoxModule.class,
      HeadlessJsTaskSupportModule.class,
      SourceCodeModule.class,
      TimingModule.class,
      UIManagerModule.class,
    })
class CoreModulesPackage extends BaseReactPackage implements ReactPackageLogger {

  private final ReactInstanceManager mReactInstanceManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;
  private final boolean mLazyViewManagersEnabled;
  private final int mMinTimeLeftInFrameForNonBatchedOperationMs;

  public CoreModulesPackage(
      ReactInstanceManager reactInstanceManager,
      DefaultHardwareBackBtnHandler hardwareBackBtnHandler,
      boolean lazyViewManagersEnabled,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mReactInstanceManager = reactInstanceManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
  }

  /**
   * This method is overridden, since OSS does not run the annotation processor to generate {@link
   * CoreModulesPackage$$ReactModuleInfoProvider} class. Here we check if it exists with the method
   * {@link canLoadClassesFromAnnotationProcessors}. If it does not exist, we generate one manually
   * in {@link CoreModulesPackage#getReactModuleInfoByInitialization()} and return that instead.
   */
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass();
    }
    try {
      Class<?> reactModuleInfoProviderClass =
          ClassFinder.findClass("com.facebook.react.CoreModulesPackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      return fallbackForMissingClass();
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    }
  }

  private ReactModuleInfoProvider fallbackForMissingClass() {
    // In OSS case, the annotation processor does not run. We fall back on creating this byhand
    Class<? extends NativeModule>[] moduleList =
        new Class[] {
          AndroidInfoModule.class,
          DeviceEventManagerModule.class,
          DeviceInfoModule.class,
          DevMenuModule.class,
          DevSettingsModule.class,
          ExceptionsManagerModule.class,
          LogBoxModule.class,
          HeadlessJsTaskSupportModule.class,
          SourceCodeModule.class,
          TimingModule.class,
          UIManagerModule.class,
        };

    final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
    for (Class<? extends NativeModule> moduleClass : moduleList) {
      ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

      reactModuleInfoMap.put(
          reactModule.name(),
          new ReactModuleInfo(
              reactModule.name(),
              moduleClass.getName(),
              reactModule.canOverrideExistingModule(),
              reactModule.needsEagerInit(),
              reactModule.isCxxModule(),
              ReactModuleInfo.classIsTurboModule(moduleClass)));
    }

    return () -> reactModuleInfoMap;
  }

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case AndroidInfoModule.NAME:
        return new AndroidInfoModule(reactContext);
      case DeviceEventManagerModule.NAME:
        return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
      case DevMenuModule.NAME:
        return new DevMenuModule(reactContext, mReactInstanceManager.getDevSupportManager());
      case DevSettingsModule.NAME:
        return new DevSettingsModule(reactContext, mReactInstanceManager.getDevSupportManager());
      case ExceptionsManagerModule.NAME:
        return new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager());
      case LogBoxModule.NAME:
        return new LogBoxModule(reactContext, mReactInstanceManager.getDevSupportManager());
      case HeadlessJsTaskSupportModule.NAME:
        return new HeadlessJsTaskSupportModule(reactContext);
      case SourceCodeModule.NAME:
        return new SourceCodeModule(reactContext);
      case TimingModule.NAME:
        return new TimingModule(reactContext, mReactInstanceManager.getDevSupportManager());
      case UIManagerModule.NAME:
        return createUIManager(reactContext);
      case DeviceInfoModule.NAME:
        return new DeviceInfoModule(reactContext);
      default:
        throw new IllegalArgumentException(
            "In CoreModulesPackage, could not find Native module for " + name);
    }
  }

  private UIManagerModule createUIManager(final ReactApplicationContext reactContext) {
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START);
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");
    try {
      if (mLazyViewManagersEnabled) {
        ViewManagerResolver resolver =
            new ViewManagerResolver() {
              @Override
              public @Nullable ViewManager getViewManager(String viewManagerName) {
                return mReactInstanceManager.createViewManager(viewManagerName);
              }

              @Override
              public Collection<String> getViewManagerNames() {
                return mReactInstanceManager.getViewManagerNames();
              }
            };

        return new UIManagerModule(
            reactContext, resolver, mMinTimeLeftInFrameForNonBatchedOperationMs);
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
