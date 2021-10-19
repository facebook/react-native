/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.os.Build;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import javax.annotation.Nullable;

/**
 * Copied from <a
 * href="https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:compose/ui/ui-graphics/src/androidMain/kotlin/androidx/compose/ui/graphics/CanvasUtils.android.kt;drc=3b2dde134afab8d58b9c39ad4820eaf9a6e014a9">
 * Compose canvas utils </a>
 */
public class CanvasUtil {
  private CanvasUtil() {}

  private @Nullable static Method mReorderBarrierMethod = null;
  private @Nullable static Method mInorderBarrierMethod = null;
  private static boolean mOrderMethodsFetched = false;

  /**
   * Enables Z support for the Canvas. The method is publicly available starting from API 29 and was
   * hidden before, so we have to resort to reflection tricks to ensure we can use this API.
   */
  @SuppressLint({"SoonBlockedPrivateApi", "PrivateApi"})
  public static void enableZ(Canvas canvas, boolean enable) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return;
    }

    if (Build.VERSION.SDK_INT >= 29) {
      if (enable) {
        canvas.enableZ();
      } else {
        canvas.disableZ();
      }
    } else {
      fetchOrderMethods();
      try {
        if (enable && mReorderBarrierMethod != null) {
          mReorderBarrierMethod.invoke(canvas);
        }
        if (!enable && mInorderBarrierMethod != null) {
          mInorderBarrierMethod.invoke(canvas);
        }
      } catch (IllegalAccessException | InvocationTargetException ignore) {
        // Do nothing
      }
    }
  }

  private static void fetchOrderMethods() {
    if (!mOrderMethodsFetched) {
      try {
        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
          // use double reflection to avoid grey list on P
          Method getDeclaredMethod =
              Class.class.getDeclaredMethod("getDeclaredMethod", String.class, Class[].class);
          mReorderBarrierMethod =
              (Method) getDeclaredMethod.invoke(Canvas.class, "insertReorderBarrier", new Class[0]);
          mInorderBarrierMethod =
              (Method) getDeclaredMethod.invoke(Canvas.class, "insertInorderBarrier", new Class[0]);
        } else {
          mReorderBarrierMethod = Canvas.class.getDeclaredMethod("insertReorderBarrier");
          mInorderBarrierMethod = Canvas.class.getDeclaredMethod("insertInorderBarrier");
        }

        if (mReorderBarrierMethod == null || mInorderBarrierMethod == null) {
          return;
        }

        mReorderBarrierMethod.setAccessible(true);
        mInorderBarrierMethod.setAccessible(true);
      } catch (IllegalAccessException ignore) {
        // Do nothing
      } catch (InvocationTargetException ignore) {
        // Do nothing
      } catch (NoSuchMethodException ignore) {
        // Do nothing
      }
      mOrderMethodsFetched = true;
    }
  }
}
