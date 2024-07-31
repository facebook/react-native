/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.Context;
import android.util.Log;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.JavaScriptModuleRegistry;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
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
    if (ReactNativeFeatureFlags.useFabricInterop()) {
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
  public @Nullable UIManager getFabricUIManager() {
    return mReactHost.getUIManager();
  }

  @Override
  public CatalystInstance getCatalystInstance() {
    Log.w(
        TAG,
        "[WARNING] Bridgeless doesn't support CatalystInstance. Accessing an API that's not part of"
            + " the new architecture is not encouraged usage.");
    return new BridgelessCatalystInstance(mReactHost);
  }

  @Deprecated
  @Override
  public boolean hasActiveCatalystInstance() {
    return hasActiveReactInstance();
  }

  @Override
  public boolean hasActiveReactInstance() {
    return mReactHost.isInstanceInitialized();
  }

  @Override
  public boolean hasCatalystInstance() {
    return false;
  }

  @Override
  public boolean hasReactInstance() {
    return mReactHost.isInstanceInitialized();
  }

  @Override
  public void destroy() {}

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

    // TODO T189052462: ReactContext caches JavaScriptModule instances
    JavaScriptModule interfaceProxy =
        (JavaScriptModule)
            Proxy.newProxyInstance(
                jsInterface.getClassLoader(),
                new Class[] {jsInterface},
                new BridgelessJSModuleInvocationHandler(mReactHost, jsInterface));
    return (T) interfaceProxy;
  }

  /** Shortcut RCTDeviceEventEmitter.emit since it's frequently used */
  @Override
  public void emitDeviceEvent(String eventName, @Nullable Object args) {
    mReactHost.callFunctionOnModule(
        "RCTDeviceEventEmitter", "emit", Arguments.fromJavaArgs(new Object[] {eventName, args}));
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
  public @Nullable NativeModule getNativeModule(String name) {
    return mReactHost.getNativeModule(name);
  }

  @Override
  @FrameworkAPI
  @UnstableReactNativeAPI
  public @Nullable JavaScriptContextHolder getJavaScriptContextHolder() {
    return mReactHost.getJavaScriptContextHolder();
  }

  @Override
  public void handleException(Exception e) {
    mReactHost.handleHostException(e);
  }

  @Override
  public @Nullable CallInvokerHolder getJSCallInvokerHolder() {
    return mReactHost.getJSCallInvokerHolder();
  }

  DefaultHardwareBackBtnHandler getDefaultHardwareBackBtnHandler() {
    return mReactHost.getDefaultBackButtonHandler();
  }
}
