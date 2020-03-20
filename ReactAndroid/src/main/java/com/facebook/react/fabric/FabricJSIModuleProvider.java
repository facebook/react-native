/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.mounting.LayoutMetricsConversions;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.BatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.DeleteMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchIntCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchStringCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.InsertMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.PreAllocateViewMountItem;
import com.facebook.react.fabric.mounting.mountitems.RemoveMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateEventEmitterMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLayoutMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLocalDataMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdatePaddingMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdatePropsMountItem;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;

public class FabricJSIModuleProvider implements JSIModuleProvider<UIManager> {

  @NonNull private final JavaScriptContextHolder mJSContext;
  @NonNull private final ReactApplicationContext mReactApplicationContext;
  @NonNull private final ComponentFactoryDelegate mComponentFactoryDelegate;
  @NonNull private final ReactNativeConfig mConfig;

  public FabricJSIModuleProvider(
      @NonNull ReactApplicationContext reactApplicationContext,
      @NonNull JavaScriptContextHolder jsContext,
      @NonNull ComponentFactoryDelegate componentFactoryDelegate,
      @NonNull ReactNativeConfig config) {
    mReactApplicationContext = reactApplicationContext;
    mJSContext = jsContext;
    mComponentFactoryDelegate = componentFactoryDelegate;
    mConfig = config;
  }

  @Override
  public UIManager get() {
    final EventBeatManager eventBeatManager = new EventBeatManager(mReactApplicationContext);
    final FabricUIManager uiManager = createUIManager(eventBeatManager);
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricJSIModuleProvider.registerBinding");
    final Binding binding = new Binding();
    // TODO T31905686: remove this call
    loadClasses();
    MessageQueueThread jsMessageQueueThread =
        mReactApplicationContext
            .getCatalystInstance()
            .getReactQueueConfiguration()
            .getJSQueueThread();
    binding.register(
        mJSContext,
        uiManager,
        eventBeatManager,
        jsMessageQueueThread,
        mComponentFactoryDelegate,
        mConfig);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    return uiManager;
  }

  private FabricUIManager createUIManager(@NonNull EventBeatManager eventBeatManager) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricJSIModuleProvider.createUIManager");
    UIManagerModule nativeModule = mReactApplicationContext.getNativeModule(UIManagerModule.class);
    EventDispatcher eventDispatcher = nativeModule.getEventDispatcher();
    FabricUIManager fabricUIManager =
        new FabricUIManager(
            mReactApplicationContext,
            nativeModule.getViewManagerRegistry_DO_NOT_USE(),
            eventDispatcher,
            eventBeatManager);

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    return fabricUIManager;
  }

  // TODO T31905686: eager load Fabric classes, this is temporary and it will be removed
  // in the near future
  private static void loadClasses() {
    BatchEventDispatchedListener.class.getClass();
    ReactNativeConfig.class.getClass();
    FabricComponents.class.getClass();
    StateWrapper.class.getClass();
    FabricEventEmitter.class.getClass();
    FabricUIManager.class.getClass();
    GuardedFrameCallback.class.getClass();
    BatchMountItem.class.getClass();
    DeleteMountItem.class.getClass();
    DispatchIntCommandMountItem.class.getClass();
    DispatchStringCommandMountItem.class.getClass();
    InsertMountItem.class.getClass();
    MountItem.class.getClass();
    RemoveMountItem.class.getClass();
    UpdateEventEmitterMountItem.class.getClass();
    UpdateLayoutMountItem.class.getClass();
    UpdateLocalDataMountItem.class.getClass();
    UpdatePaddingMountItem.class.getClass();
    UpdatePropsMountItem.class.getClass();
    LayoutMetricsConversions.class.getClass();
    MountingManager.class.getClass();
    Binding.class.getClass();
    ComponentFactoryDelegate.class.getClass();
    EventBeatManager.class.getClass();
    EventEmitterWrapper.class.getClass();
    StateWrapperImpl.class.getClass();
    FabricSoLoader.class.getClass();
    PreAllocateViewMountItem.class.getClass();
  }
}
