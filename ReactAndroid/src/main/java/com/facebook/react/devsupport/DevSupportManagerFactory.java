/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.lang.reflect.Constructor;

import android.content.Context;

import com.facebook.react.devsupport.interfaces.DevSupportManager;

/**
 * A simple factory that creates instances of {@link DevSupportManager} implementations. Uses
 * reflection to create DevSupportManagerImpl if it exists. This allows ProGuard to strip that class
 * and its dependencies in release builds. If the class isn't found,
 * {@link DisabledDevSupportManager} is returned instead.
 */
public class DevSupportManagerFactory {

  private static final String DEVSUPPORT_IMPL_PACKAGE = "com.facebook.react.devsupport";
  private static final String DEVSUPPORT_IMPL_CLASS = "DevSupportManagerImpl";

  public static DevSupportManager create(
      Context applicationContext,
      ReactInstanceDevCommandsHandler reactInstanceCommandsHandler,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      int minNumShakes) {

    return create(
      applicationContext,
      reactInstanceCommandsHandler,
      packagerPathForJSBundleName,
      enableOnCreate,
      null,
      minNumShakes);
  }

  public static DevSupportManager create(
    Context applicationContext,
    ReactInstanceDevCommandsHandler reactInstanceCommandsHandler,
    @Nullable String packagerPathForJSBundleName,
    boolean enableOnCreate,
    @Nullable RedBoxHandler redBoxHandler,
    int minNumShakes) {
    if (!enableOnCreate) {
      return new DisabledDevSupportManager();
    }
    try {
      // ProGuard is surprisingly smart in this case and will keep a class if it detects a call to
      // Class.forName() with a static string. So instead we generate a quasi-dynamic string to
      // confuse it.
      String className =
        new StringBuilder(DEVSUPPORT_IMPL_PACKAGE)
          .append(".")
          .append(DEVSUPPORT_IMPL_CLASS)
          .toString();
      Class<?> devSupportManagerClass =
        Class.forName(className);
      Constructor constructor =
        devSupportManagerClass.getConstructor(
          Context.class,
          ReactInstanceDevCommandsHandler.class,
          String.class,
          boolean.class,
          RedBoxHandler.class,
          int.class);
      return (DevSupportManager) constructor.newInstance(
        applicationContext,
        reactInstanceCommandsHandler,
        packagerPathForJSBundleName,
        true,
        redBoxHandler,
        minNumShakes);
    } catch (Exception e) {
      throw new RuntimeException(
        "Requested enabled DevSupportManager, but DevSupportManagerImpl class was not found" +
          " or could not be created",
        e);
    }
  }
}
