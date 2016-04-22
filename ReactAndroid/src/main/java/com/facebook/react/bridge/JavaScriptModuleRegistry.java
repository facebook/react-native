/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import java.lang.Class;
import java.lang.ref.WeakReference;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.WeakHashMap;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;

/**
 * Class responsible for holding all the {@link JavaScriptModule}s registered to this
 * {@link CatalystInstance}. Uses Java proxy objects to dispatch method calls on JavaScriptModules
 * to the bridge using the corresponding module and method ids so the proper function is executed in
 * JavaScript.
 */
public class JavaScriptModuleRegistry {

  private final CatalystInstance mCatalystInstance;
  private final WeakHashMap<ExecutorToken, HashMap<Class<? extends JavaScriptModule>, JavaScriptModule>> mModuleInstances;
  private final HashMap<Class<? extends JavaScriptModule>, JavaScriptModuleRegistration> mModuleRegistrations;

  public JavaScriptModuleRegistry(
      CatalystInstance instance,
      JavaScriptModulesConfig config) {
    mCatalystInstance = instance;
    mModuleInstances = new WeakHashMap<>();
    mModuleRegistrations = new HashMap<>();
    for (JavaScriptModuleRegistration registration : config.getModuleDefinitions()) {
      mModuleRegistrations.put(registration.getModuleInterface(), registration);
    }
  }

  public synchronized  <T extends JavaScriptModule> T getJavaScriptModule(ExecutorToken executorToken, Class<T> moduleInterface) {
    HashMap<Class<? extends JavaScriptModule>, JavaScriptModule> instancesForContext =
        mModuleInstances.get(executorToken);
    if (instancesForContext == null) {
      instancesForContext = new HashMap<>();
      mModuleInstances.put(executorToken, instancesForContext);
    }

    JavaScriptModule module = instancesForContext.get(moduleInterface);
    if (module != null) {
      return (T) module;
    }

    JavaScriptModuleRegistration registration =
        Assertions.assertNotNull(
            mModuleRegistrations.get(moduleInterface),
            "JS module " + moduleInterface.getSimpleName() + " hasn't been registered!");
    JavaScriptModule interfaceProxy = (JavaScriptModule) Proxy.newProxyInstance(
        moduleInterface.getClassLoader(),
        new Class[]{moduleInterface},
        new JavaScriptModuleInvocationHandler(executorToken, mCatalystInstance, registration));
    instancesForContext.put(moduleInterface, interfaceProxy);
    return (T) interfaceProxy;
  }

  private static class JavaScriptModuleInvocationHandler implements InvocationHandler {

    private final WeakReference<ExecutorToken> mExecutorToken;
    private final CatalystInstance mCatalystInstance;
    private final JavaScriptModuleRegistration mModuleRegistration;

    public JavaScriptModuleInvocationHandler(
        ExecutorToken executorToken,
        CatalystInstance catalystInstance,
        JavaScriptModuleRegistration moduleRegistration) {
      mExecutorToken = new WeakReference<>(executorToken);
      mCatalystInstance = catalystInstance;
      mModuleRegistration = moduleRegistration;
    }

    @Override
    public @Nullable Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
      ExecutorToken executorToken = mExecutorToken.get();
      if (executorToken == null) {
        FLog.w(ReactConstants.TAG, "Dropping JS call, ExecutorToken went away...");
        return null;
      }
      String tracingName = mModuleRegistration.getTracingName(method);
      mCatalystInstance.callFunction(
        executorToken,
          mModuleRegistration.getModuleId(),
          mModuleRegistration.getMethodId(method),
          Arguments.fromJavaArgs(args),
          tracingName);
      return null;
    }
  }
}
