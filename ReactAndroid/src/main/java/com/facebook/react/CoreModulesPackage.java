/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.inject.Provider;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.devsupport.HMRClient;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.devsupport.JSCSamplingProfiler;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.core.JSTimersExecution;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.facebook.react.modules.core.Timing;
import com.facebook.react.modules.debug.AnimationsDebugModule;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.AppRegistry;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.debug.DebugComponentOwnershipModule;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.systrace.Systrace;

import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList({
  AndroidInfoModule.class,
  AnimationsDebugModule.class,
  DeviceEventManagerModule.class,
  ExceptionsManagerModule.class,
  HeadlessJsTaskSupportModule.class,
  SourceCodeModule.class,
  Timing.class,
  UIManagerModule.class,
  // Debug only
  DebugComponentOwnershipModule.class,
  JSCHeapCapture.class,
  JSCSamplingProfiler.class,
})
/* package */ class CoreModulesPackage extends LazyReactPackage {

  private final ReactInstanceManager mReactInstanceManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;
  private final UIImplementationProvider mUIImplementationProvider;

  CoreModulesPackage(
    ReactInstanceManager reactInstanceManager,
    DefaultHardwareBackBtnHandler hardwareBackBtnHandler,
    UIImplementationProvider uiImplementationProvider) {
    mReactInstanceManager = reactInstanceManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
    mUIImplementationProvider = uiImplementationProvider;
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();

    moduleSpecList.add(
      new ModuleSpec(AndroidInfoModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new AndroidInfoModule();
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(AnimationsDebugModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new AnimationsDebugModule(
            reactContext,
            mReactInstanceManager.getDevSupportManager().getDevSettings());
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(DeviceEventManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(ExceptionsManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager());
        }
      }));
    moduleSpecList
      .add(new ModuleSpec(HeadlessJsTaskSupportModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new HeadlessJsTaskSupportModule(reactContext);
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(SourceCodeModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new SourceCodeModule(mReactInstanceManager.getSourceUrl());
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(Timing.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new Timing(reactContext, mReactInstanceManager.getDevSupportManager());
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(UIManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return createUIManager(reactContext);
        }
      }));

    if (ReactBuildConfig.DEBUG) {
      moduleSpecList.add(
        new ModuleSpec(DebugComponentOwnershipModule.class, new Provider<NativeModule>() {
          @Override
          public NativeModule get() {
            return new DebugComponentOwnershipModule(reactContext);
          }
        }));
      moduleSpecList.add(
        new ModuleSpec(JSCHeapCapture.class, new Provider<NativeModule>() {
          @Override
          public NativeModule get() {
            return new JSCHeapCapture(reactContext);
          }
        }));
      moduleSpecList.add(
        new ModuleSpec(JSCSamplingProfiler.class, new Provider<NativeModule>() {
          @Override
          public NativeModule get() {
            return new JSCSamplingProfiler(reactContext);
          }
        }));
    }

    return moduleSpecList;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    List<Class<? extends JavaScriptModule>> jsModules = new ArrayList<>(Arrays.asList(
        DeviceEventManagerModule.RCTDeviceEventEmitter.class,
        JSTimersExecution.class,
        RCTEventEmitter.class,
        RCTNativeAppEventEmitter.class,
        AppRegistry.class,
        com.facebook.react.bridge.Systrace.class,
        HMRClient.class));

    if (ReactBuildConfig.DEBUG) {
      jsModules.add(DebugComponentOwnershipModule.RCTDebugComponentOwnership.class);
      jsModules.add(JSCHeapCapture.HeapCapture.class);
      jsModules.add(JSCSamplingProfiler.SamplingProfiler.class);
    }

    return jsModules;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    // This has to be done via reflection or we break open source.
    return LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
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
        mUIImplementationProvider);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END);
    }
  }
}
