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

import java.lang.ref.WeakReference;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
  private final HashMap<Class<? extends JavaScriptModule>, JavaScriptModule> mModuleInstances;
  private final HashMap<Class<? extends JavaScriptModule>, JavaScriptModuleRegistration> mModuleRegistrations;

  public JavaScriptModuleRegistry(List<JavaScriptModuleRegistration> config) {
    mModuleInstances = new HashMap<>();
    mModuleRegistrations = new HashMap<>();
    for (JavaScriptModuleRegistration registration : config) {
      mModuleRegistrations.put(registration.getModuleInterface(), registration);
    }
  }

  public synchronized <T extends JavaScriptModule> T getJavaScriptModule(
      CatalystInstance instance,
      Class<T> moduleInterface) {
    JavaScriptModule module = mModuleInstances.get(moduleInterface);
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
        new JavaScriptModuleInvocationHandler(instance, registration));
    mModuleInstances.put(moduleInterface, interfaceProxy);
    return (T) interfaceProxy;
  }

  public static class Builder {
    private List<JavaScriptModuleRegistration> mModules =
      new ArrayList<JavaScriptModuleRegistration>();

    public Builder add(Class<? extends JavaScriptModule> moduleInterfaceClass) {
      mModules.add(new JavaScriptModuleRegistration(moduleInterfaceClass));
      return this;
    }

    public JavaScriptModuleRegistry build() {
      return new JavaScriptModuleRegistry(mModules);
    }
  }

  private static class JavaScriptModuleInvocationHandler implements InvocationHandler {
    private final CatalystInstance mCatalystInstance;
    private final JavaScriptModuleRegistration mModuleRegistration;

    public JavaScriptModuleInvocationHandler(
        CatalystInstance catalystInstance,
        JavaScriptModuleRegistration moduleRegistration) {
      mCatalystInstance = catalystInstance;
      mModuleRegistration = moduleRegistration;
    }

    @Override
    public @Nullable Object invoke(Object proxy, Method method, @Nullable Object[] args) throws Throwable {
      NativeArray jsArgs = args != null ? Arguments.fromJavaArgs(args) : new WritableNativeArray();
      mCatalystInstance.callFunction(
        mModuleRegistration.getName(),
        method.getName(),
        jsArgs
      );
      return null;
    }
  }
}
