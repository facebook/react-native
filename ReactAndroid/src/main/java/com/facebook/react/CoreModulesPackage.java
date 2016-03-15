/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.devsupport.HMRClient;
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

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
/* package */ class CoreModulesPackage implements ReactPackage {

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
  public List<NativeModule> createNativeModules(
      ReactApplicationContext catalystApplicationContext) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");
    UIManagerModule uiManagerModule;
    try {
      List<ViewManager> viewManagersList = mReactInstanceManager.createAllViewManagers(
          catalystApplicationContext);
      uiManagerModule = new UIManagerModule(
          catalystApplicationContext,
          viewManagersList,
          mUIImplementationProvider.createUIImplementation(
              catalystApplicationContext,
              viewManagersList));
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    return Arrays.<NativeModule>asList(
        new AnimationsDebugModule(
            catalystApplicationContext,
            mReactInstanceManager.getDevSupportManager().getDevSettings()),
        new AndroidInfoModule(),
        new DeviceEventManagerModule(catalystApplicationContext, mHardwareBackBtnHandler),
        new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager()),
        new Timing(catalystApplicationContext),
        new SourceCodeModule(
            mReactInstanceManager.getSourceUrl(),
            mReactInstanceManager.getDevSupportManager().getSourceMapUrl()),
        uiManagerModule,
        new DebugComponentOwnershipModule(catalystApplicationContext));
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Arrays.asList(
        DeviceEventManagerModule.RCTDeviceEventEmitter.class,
        JSTimersExecution.class,
        RCTEventEmitter.class,
        RCTNativeAppEventEmitter.class,
        AppRegistry.class,
        com.facebook.react.bridge.Systrace.class,
        HMRClient.class,
        DebugComponentOwnershipModule.RCTDebugComponentOwnership.class);
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>(0);
  }
}
