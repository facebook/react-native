/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.RuntimeScheduler;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerProvider;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.systrace.Systrace;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class FabricUIManagerProviderImpl implements UIManagerProvider {

  private final ComponentFactory mComponentFactory;
  private final ReactNativeConfig mConfig;
  private final ViewManagerRegistry mViewManagerRegistry;

  public FabricUIManagerProviderImpl(
      ComponentFactory componentFactory,
      ReactNativeConfig config,
      ViewManagerRegistry viewManagerRegistry) {
    mComponentFactory = componentFactory;
    mConfig = config;
    mViewManagerRegistry = viewManagerRegistry;
  }

  public UIManager createUIManager(ReactApplicationContext reactApplicationContext) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.create");
    EventBeatManager eventBeatManager = new EventBeatManager();
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.createUIManager");

    FabricUIManager fabricUIManager =
        new FabricUIManager(reactApplicationContext, mViewManagerRegistry, eventBeatManager);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.registerBinding");
    final Binding binding = new BindingImpl();

    CatalystInstance catalystInstance = reactApplicationContext.getCatalystInstance();

    RuntimeExecutor runtimeExecutor = catalystInstance.getRuntimeExecutor();
    RuntimeScheduler runtimeScheduler = catalystInstance.getRuntimeScheduler();

    if (runtimeExecutor != null && runtimeScheduler != null) {
      binding.register(
          runtimeExecutor,
          runtimeScheduler,
          fabricUIManager,
          eventBeatManager,
          mComponentFactory,
          mConfig);
    } else {
      throw new IllegalStateException(
          "Unable to register FabricUIManager with CatalystInstance, runtimeExecutor and"
              + " runtimeScheduler must not be null");
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    return fabricUIManager;
  }
}
