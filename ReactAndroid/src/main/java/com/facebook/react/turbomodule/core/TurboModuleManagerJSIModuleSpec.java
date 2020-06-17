package com.facebook.react.turbomodule.core;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;

public class TurboModuleManagerJSIModuleSpec implements JSIModuleSpec<TurboModuleManager>, JSIModuleProvider<TurboModuleManager> {
  private final ReactNativeHost mReactNativeHost;
  private final ReactApplicationContext mContext;
  private final JavaScriptContextHolder mJsContext;

  public TurboModuleManagerJSIModuleSpec(ReactNativeHost host, ReactApplicationContext context, JavaScriptContextHolder jsContext) {
    mReactNativeHost = host;
    mContext = context;
    mJsContext = jsContext;
  }

  @Override
  public JSIModuleType getJSIModuleType() {
    return JSIModuleType.TurboModuleManager;
  }

  @Override
  public JSIModuleProvider<TurboModuleManager> getJSIModuleProvider() {
    return this;
  }

  @Override
  public TurboModuleManager get() {
    ReactPackageTurboModuleManagerDelegate delegate =
      new ReactPackageTurboModuleManagerDelegate.Builder()
        .setReactApplicationContext(mContext)
        .setPackages(mReactNativeHost.getReactInstanceManager().getPackages())
        .build();
    return new TurboModuleManager(
      mJsContext, delegate,
      mContext.getCatalystInstance().getJSCallInvokerHolder(),
      mContext.getCatalystInstance().getNativeCallInvokerHolder());
  }
}
