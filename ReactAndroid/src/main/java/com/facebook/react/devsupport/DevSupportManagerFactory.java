/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;

import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.packagerconnection.RequestHandler;

import java.lang.reflect.Constructor;
import java.util.Map;

import javax.annotation.Nullable;

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
      ReactInstanceManagerDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      int minNumShakes) {

    return create(
      applicationContext,
      reactInstanceManagerHelper,
      packagerPathForJSBundleName,
      enableOnCreate,
      null,
      null,
      minNumShakes,
      null);
  }

  public static DevSupportManager create(
    Context applicationContext,
    ReactInstanceManagerDevHelper reactInstanceManagerHelper,
    @Nullable String packagerPathForJSBundleName,
    boolean enableOnCreate,
    @Nullable RedBoxHandler redBoxHandler,
    @Nullable DevBundleDownloadListener devBundleDownloadListener,
    int minNumShakes,
    @Nullable Map<String, RequestHandler> customPackagerCommandHandlers) {
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
          ReactInstanceManagerDevHelper.class,
          String.class,
          boolean.class,
          RedBoxHandler.class,
          DevBundleDownloadListener.class,
          int.class,
          Map.class);
      return (DevSupportManager) constructor.newInstance(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        true,
        redBoxHandler,
        devBundleDownloadListener,
        minNumShakes,
        customPackagerCommandHandlers);
    } catch (Exception e) {
      throw new RuntimeException(
        "Requested enabled DevSupportManager, but DevSupportManagerImpl class was not found" +
          " or could not be created",
        e);
    }
  }
}
