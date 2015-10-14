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
import java.util.Comparator;
import java.util.Map;
import java.util.Set;

import com.facebook.react.common.MapBuilder;
import com.facebook.infer.annotation.Assertions;

/**
 * Registration info for a {@link JavaScriptModule}. Maps its methods to method ids.
 */
@Immutable
class JavaScriptModuleRegistration {

  private final int mModuleId;
  private final Class<? extends JavaScriptModule> mModuleInterface;
  private final Map<Method, Integer> mMethodsToIds;
  private final Map<Method, String> mMethodsToTracingNames;

  JavaScriptModuleRegistration(int moduleId, Class<? extends JavaScriptModule> moduleInterface) {
    mModuleId = moduleId;
    mModuleInterface = moduleInterface;

    mMethodsToIds = MapBuilder.newHashMap();
    mMethodsToTracingNames = MapBuilder.newHashMap();
    final Method[] declaredMethods = mModuleInterface.getDeclaredMethods();
    Arrays.sort(declaredMethods, new Comparator<Method>() {
      @Override
      public int compare(Method lhs, Method rhs) {
        return lhs.getName().compareTo(rhs.getName());
      }
    });

    // Methods are sorted by name so we can dupe check and have obvious ordering
    String previousName = null;
    for (int i = 0; i < declaredMethods.length; i++) {
      Method method = declaredMethods[i];
      String name = method.getName();
      Assertions.assertCondition(
          !name.equals(previousName),
          "Method overloading is unsupported: " + mModuleInterface.getName() + "#" + name);
      previousName = name;

      mMethodsToIds.put(method, i);
      mMethodsToTracingNames.put(method, "JSCall__" + getName() + "_" + method.getName());
    }
  }

  public int getModuleId() {
    return mModuleId;
  }

  public int getMethodId(Method method) {
    final Integer id = mMethodsToIds.get(method);
    if (id == null) {
      Assertions.assertUnreachable("Unknown method: " + method.getName());
    }
    return id.intValue();
  }

  public String getTracingName(Method method) {
    return Assertions.assertNotNull(mMethodsToTracingNames.get(method));
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

  public Set<Method> getMethods() {
    return mMethodsToIds.keySet();
  }
}
