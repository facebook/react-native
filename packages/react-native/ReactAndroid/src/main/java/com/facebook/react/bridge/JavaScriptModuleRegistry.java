/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.common.build.ReactBuildConfig;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

/**
 * Class responsible for holding all the {@link JavaScriptModule}s. Uses Java proxy objects to
 * dispatch method calls on JavaScriptModules to the bridge using the corresponding module and
 * method ids so the proper function is executed in JavaScript.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public final class JavaScriptModuleRegistry {
  private final HashMap<Class<? extends JavaScriptModule>, JavaScriptModule> mModuleInstances;

  public JavaScriptModuleRegistry() {
    mModuleInstances = new HashMap<>();
  }

  public synchronized <T extends JavaScriptModule> T getJavaScriptModule(
      CatalystInstance instance, Class<T> moduleInterface) {
    JavaScriptModule module = mModuleInstances.get(moduleInterface);
    if (module != null) {
      return (T) module;
    }

    JavaScriptModule interfaceProxy =
        (JavaScriptModule)
            Proxy.newProxyInstance(
                moduleInterface.getClassLoader(),
                new Class[] {moduleInterface},
                new JavaScriptModuleInvocationHandler(instance, moduleInterface));
    mModuleInstances.put(moduleInterface, interfaceProxy);
    return (T) interfaceProxy;
  }

  private static class JavaScriptModuleInvocationHandler implements InvocationHandler {
    private final CatalystInstance mCatalystInstance;
    private final Class<? extends JavaScriptModule> mModuleInterface;
    private @Nullable String mName;

    public JavaScriptModuleInvocationHandler(
        CatalystInstance catalystInstance, Class<? extends JavaScriptModule> moduleInterface) {
      mCatalystInstance = catalystInstance;
      mModuleInterface = moduleInterface;

      if (ReactBuildConfig.DEBUG) {
        Set<String> methodNames = new HashSet<>();
        for (Method method : mModuleInterface.getDeclaredMethods()) {
          if (!methodNames.add(method.getName())) {
            throw new AssertionError(
                "Method overloading is unsupported: "
                    + mModuleInterface.getName()
                    + "#"
                    + method.getName());
          }
        }
      }
    }

    private String getJSModuleName() {
      if (mName == null) {
        // Getting the class name every call is expensive, so cache it
        mName = JavaScriptModuleRegistry.getJSModuleName(mModuleInterface);
      }
      return mName;
    }

    @Override
    public @Nullable Object invoke(Object proxy, Method method, @Nullable Object[] args)
        throws Throwable {
      NativeArray jsArgs = args != null ? Arguments.fromJavaArgs(args) : new WritableNativeArray();
      mCatalystInstance.callFunction(getJSModuleName(), method.getName(), jsArgs);
      return null;
    }
  }

  public static String getJSModuleName(Class<? extends JavaScriptModule> jsModuleInterface) {
    // With proguard obfuscation turned on, proguard apparently (poorly) emulates inner
    // classes or something because Class#getSimpleName() no longer strips the outer
    // class name. We manually strip it here if necessary.
    String name = jsModuleInterface.getSimpleName();
    int dollarSignIndex = name.lastIndexOf('$');
    if (dollarSignIndex != -1) {
      name = name.substring(dollarSignIndex + 1);
    }
    return name;
  }
}
