// Copyright 2004-present Facebook. All Rights Reserved.
package com.facebook.react.fabric;

import com.facebook.react.fabric.jsi.Binding;
import com.facebook.react.fabric.jsi.ComponentFactoryDelegate;
import com.facebook.react.fabric.jsi.EventBeatManager;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;

public class FabricJSIModuleProvider implements JSIModuleProvider<UIManager> {

  private final ReactInstanceManager mReactInstanceManager;
  private final JavaScriptContextHolder mJSContext;
  private final ReactApplicationContext mReactApplicationContext;
  private final ComponentFactoryDelegate mComponentFactoryDelegate;

  public FabricJSIModuleProvider(
        ReactInstanceManager reactInstanceManager,
        ReactApplicationContext reactApplicationContext,
        JavaScriptContextHolder jsContext,
      ComponentFactoryDelegate componentFactoryDelegate) {
      mReactInstanceManager = reactInstanceManager;
      mReactApplicationContext = reactApplicationContext;
      mJSContext = jsContext;
      mComponentFactoryDelegate = componentFactoryDelegate;
    }

  @Override
  public UIManager get() {
    final EventBeatManager eventBeatManager =
        new EventBeatManager(mJSContext, mReactApplicationContext);
    final UIManager uiManager = createUIManager(eventBeatManager);
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricJSIModuleProvider.registerBinding");
    final FabricBinding binding = new Binding();
    MessageQueueThread jsMessageQueueThread =
        mReactApplicationContext
            .getCatalystInstance()
            .getReactQueueConfiguration()
            .getJSQueueThread();
    binding.register(mJSContext, (FabricBinder) uiManager, eventBeatManager, jsMessageQueueThread,
      mComponentFactoryDelegate);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    return uiManager;
  }

  private UIManager createUIManager(EventBeatManager eventBeatManager) {
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
}
