package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.lang.reflect.Constructor;

import android.content.Context;
import android.util.Log;

import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.build.ReactBuildConfig;

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
      boolean enableOnCreate) {
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
              boolean.class);
      return (DevSupportManager) constructor.newInstance(
          applicationContext,
          reactInstanceCommandsHandler,
          packagerPathForJSBundleName,
          true);
    } catch (Exception e) {
      throw new RuntimeException(
          "Requested enabled DevSupportManager, but DevSupportManagerImpl class was not found" +
              " or could not be created",
          e);
    }
  }

}
