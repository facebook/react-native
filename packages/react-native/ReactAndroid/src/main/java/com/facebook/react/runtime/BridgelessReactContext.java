/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.Context;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.JavaScriptModuleRegistry;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashBridgeNotAllowedSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherProvider;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicReference;
import javax.annotation.Nullable;

/**
 * This class is used instead of {@link ReactApplicationContext} when React Native is operating in
 * bridgeless mode. The purpose of this class is to override some methods on {@link
 * com.facebook.react.bridge.ReactContext} that use the {@link
 * com.facebook.react.bridge.CatalystInstance}, which doesn't exist in bridgeless mode.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class BridgelessReactContext extends ReactApplicationContext implements EventDispatcherProvider {

  private final ReactHostImpl mReactHost;
  private final AtomicReference<String> mSourceURL = new AtomicReference<>();
  private final String TAG = this.getClass().getSimpleName();

  BridgelessReactContext(Context context, ReactHostImpl host) {
    super(context);
    mReactHost = host;
    if (ReactFeatureFlags.unstable_useFabricInterop) {
      initializeInteropModules();
    }
  }

  @Override
  public boolean isBridgeless() {
    return true;
  }

  @Override
  public EventDispatcher getEventDispatcher() {
    return mReactHost.getEventDispatcher();
  }

  public void setSourceURL(String sourceURL) {
    mSourceURL.set(sourceURL);
  }

  @Override
  public @Nullable String getSourceURL() {
    return mSourceURL.get();
  }

  @Override
  public @Nullable JSIModule getJSIModule(JSIModuleType moduleType) {
    if (moduleType == JSIModuleType.UIManager) {
      return mReactHost.getUIManager();
    }
    throw new UnsupportedOperationException(
        "getJSIModule is not implemented for bridgeless mode. Trying to get module: "
            + moduleType.name());
  }

  @Override
  public CatalystInstance getCatalystInstance() {
    ReactSoftExceptionLogger.logSoftExceptionVerbose(
        TAG,
        new ReactNoCrashBridgeNotAllowedSoftException(
            "getCatalystInstance() cannot be called when the bridge is disabled"));
    throw new UnsupportedOperationException("There is no Catalyst instance in bridgeless mode.");
  }

  @Override
  public boolean hasActiveReactInstance() {
    return mReactHost.isInstanceInitialized();
  }

  DevSupportManager getDevSupportManager() {
    return mReactHost.getDevSupportManager();
  }

  @Override
  public void registerSegment(int segmentId, String path, Callback callback) {
    mReactHost.registerSegment(segmentId, path, callback);
  }

  private static class BridgelessJSModuleInvocationHandler implements InvocationHandler {
    private final ReactHostImpl mReactHost;
    private final Class<? extends JavaScriptModule> mJSModuleInterface;

    public BridgelessJSModuleInvocationHandler(
        ReactHostImpl reactHost, Class<? extends JavaScriptModule> jsModuleInterface) {
      mReactHost = reactHost;
      mJSModuleInterface = jsModuleInterface;
    }

    @Override
    public @Nullable Object invoke(Object proxy, Method method, @Nullable Object[] args) {
      NativeArray jsArgs = args != null ? Arguments.fromJavaArgs(args) : new WritableNativeArray();
      mReactHost.callFunctionOnModule(
          JavaScriptModuleRegistry.getJSModuleName(mJSModuleInterface), method.getName(), jsArgs);
      return null;
    }
  }

  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    if (mInteropModuleRegistry != null
        && mInteropModuleRegistry.shouldReturnInteropModule(jsInterface)) {
      return mInteropModuleRegistry.getInteropModule(jsInterface);
    }
    JavaScriptModule interfaceProxy =
        (JavaScriptModule)
            Proxy.newProxyInstance(
                jsInterface.getClassLoader(),
                new Class[] {jsInterface},
                new BridgelessJSModuleInvocationHandler(mReactHost, jsInterface));
    return (T) interfaceProxy;
  }

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    return mReactHost.hasNativeModule(nativeModuleInterface);
  }

  @Override
  public Collection<NativeModule> getNativeModules() {
    return mReactHost.getNativeModules();
  }

  @Override
  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mReactHost.getNativeModule(nativeModuleInterface);
  }

  @Override
  public void handleException(Exception e) {
    mReactHost.handleHostException(e);
  }

  DefaultHardwareBackBtnHandler getDefaultHardwareBackBtnHandler() {
    return mReactHost.getDefaultBackButtonHandler();
  }
}
