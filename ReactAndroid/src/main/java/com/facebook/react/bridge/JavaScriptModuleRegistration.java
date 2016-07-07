/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.concurrent.Immutable;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.facebook.react.common.build.ReactBuildConfig;

/**
 * Registration info for a {@link JavaScriptModule}. Maps its methods to method ids.
 */
@Immutable
public class JavaScriptModuleRegistration {

  private final Class<? extends JavaScriptModule> mModuleInterface;

  public JavaScriptModuleRegistration(Class<? extends JavaScriptModule> moduleInterface) {
    mModuleInterface = moduleInterface;

    if (ReactBuildConfig.DEBUG) {
      Set<String> methodNames = new LinkedHashSet<>();
      for (Method method : mModuleInterface.getDeclaredMethods()) {
        if (!methodNames.add(method.getName())) {
          throw new AssertionError(
            "Method overloading is unsupported: " + mModuleInterface.getName() + "#" +
              method.getName());
        }
      }
    }
  }

  public Class<? extends JavaScriptModule> getModuleInterface() {
    return mModuleInterface;
  }

  public String getName() {
    // With proguard obfuscation turned on, proguard apparently (poorly) emulates inner classes or
    // something because Class#getSimpleName() no longer strips the outer class name. We manually
    // strip it here if necessary.
    String name = mModuleInterface.getSimpleName();
    int dollarSignIndex = name.lastIndexOf('$');
    if (dollarSignIndex != -1) {
      name = name.substring(dollarSignIndex + 1);
    }
    return name;
  }

  public List<Method> getMethods() {
    return Arrays.asList(mModuleInterface.getDeclaredMethods());
  }
}
