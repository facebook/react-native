/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.config.ReactFeatureFlags.enableExperimentalStaticViewConfigs;

import androidx.annotation.NonNull;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.mounting.LayoutMetricsConversions;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchIntCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchStringCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.PreAllocateViewMountItem;
import com.facebook.react.fabric.mounting.mountitems.SendAccessibilityEvent;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;

public class FabricJSIModuleProvider implements JSIModuleProvider<UIManager> {

  @NonNull private final ReactApplicationContext mReactApplicationContext;
  @NonNull private final ComponentFactory mComponentFactory;
  @NonNull private final ReactNativeConfig mConfig;
  @NonNull private final ViewManagerRegistry mViewManagerRegistry;

  public FabricJSIModuleProvider(
      @NonNull ReactApplicationContext reactApplicationContext,
      @NonNull ComponentFactory componentFactory,
      @NonNull ReactNativeConfig config,
      @NonNull ViewManagerRegistry viewManagerRegistry) {
    mReactApplicationContext = reactApplicationContext;
    mComponentFactory = componentFactory;
    mConfig = config;
    mViewManagerRegistry = viewManagerRegistry;
  }

  @Override
  public UIManager get() {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricJSIModuleProvider.get");
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
        mReactApplicationContext.getCatalystInstance().getRuntimeExecutor(),
        uiManager,
        eventBeatManager,
        jsMessageQueueThread,
        mComponentFactory,
        mConfig);

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    return uiManager;
  }

  private FabricUIManager createUIManager(@NonNull EventBeatManager eventBeatManager) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricJSIModuleProvider.createUIManager");

    FabricUIManager fabricUIManager;
    if (enableExperimentalStaticViewConfigs) {
      fabricUIManager =
          new FabricUIManager(mReactApplicationContext, mViewManagerRegistry, eventBeatManager);
    } else {
      // TODO T83943316: Remove this code once StaticViewConfigs are enabled by default
      UIManagerModule nativeModule =
          Assertions.assertNotNull(mReactApplicationContext.getNativeModule(UIManagerModule.class));
      EventDispatcher eventDispatcher = nativeModule.getEventDispatcher();
      fabricUIManager =
          new FabricUIManager(
              mReactApplicationContext, mViewManagerRegistry, eventDispatcher, eventBeatManager);
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    return fabricUIManager;
  }

  // TODO T31905686: eager load Fabric classes, this is temporary and it will be removed
  // in the near future
  private static void loadClasses() {
    EventBeatManager.class.getClass();
    EventEmitterWrapper.class.getClass();
    FabricEventEmitter.class.getClass();
    DispatchCommandMountItem.class.getClass();
    DispatchIntCommandMountItem.class.getClass();
    DispatchStringCommandMountItem.class.getClass();
    MountItem.class.getClass();
    PreAllocateViewMountItem.class.getClass();
    SendAccessibilityEvent.class.getClass();
    LayoutMetricsConversions.class.getClass();
    MountingManager.class.getClass();
    Binding.class.getClass();
    ComponentFactory.class.getClass();
    FabricComponents.class.getClass();
    FabricSoLoader.class.getClass();
    FabricUIManager.class.getClass();
    GuardedFrameCallback.class.getClass();
    StateWrapper.class.getClass();
    StateWrapperImpl.class.getClass();
    BatchEventDispatchedListener.class.getClass();
    ReactNativeConfig.class.getClass();
    IntBufferBatchMountItem.class.getClass();
  }
}
