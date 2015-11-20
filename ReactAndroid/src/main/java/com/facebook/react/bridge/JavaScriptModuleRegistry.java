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
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;

import com.facebook.infer.annotation.Assertions;

/**
 * Class responsible for holding all the {@link JavaScriptModule}s registered to this
 * {@link CatalystInstance}. Uses Java proxy objects to dispatch method calls on JavaScriptModules
 * to the bridge using the corresponding module and method ids so the proper function is executed in
 * JavaScript.
 */
/*package*/ class JavaScriptModuleRegistry {

  private final HashMap<Class<? extends JavaScriptModule>, JavaScriptModule> mModuleInstances;

  public JavaScriptModuleRegistry(
      CatalystInstanceImpl instance,
      JavaScriptModulesConfig config) {
    mModuleInstances = new HashMap<>();
    for (JavaScriptModuleRegistration registration : config.getModuleDefinitions()) {
      Class<? extends JavaScriptModule> moduleInterface = registration.getModuleInterface();
      JavaScriptModule interfaceProxy = (JavaScriptModule) Proxy.newProxyInstance(
          moduleInterface.getClassLoader(),
          new Class[]{moduleInterface},
          new JavaScriptModuleInvocationHandler(instance, registration));

      mModuleInstances.put(moduleInterface, interfaceProxy);
    }
  }

  public <T extends JavaScriptModule> T getJavaScriptModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(
        mModuleInstances.get(moduleInterface),
        "JS module " + moduleInterface.getSimpleName() + " hasn't been registered!");
  }

  private static class JavaScriptModuleInvocationHandler implements InvocationHandler {

    private final CatalystInstanceImpl mCatalystInstance;
    private final JavaScriptModuleRegistration mModuleRegistration;

    public JavaScriptModuleInvocationHandler(
        CatalystInstanceImpl catalystInstance,
        JavaScriptModuleRegistration moduleRegistration) {
      mCatalystInstance = catalystInstance;
      mModuleRegistration = moduleRegistration;
    }

    @Override
    public @Nullable Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
      String tracingName = mModuleRegistration.getTracingName(method);
      mCatalystInstance.callFunction(
          mModuleRegistration.getModuleId(),
          mModuleRegistration.getMethodId(method),
          Arguments.fromJavaArgs(args),
          tracingName);
      return null;
    }
  }
}
