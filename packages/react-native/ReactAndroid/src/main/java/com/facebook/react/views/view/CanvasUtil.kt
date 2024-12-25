/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Build
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method

/**
 * Copied from
 * [ Compose canvas utils ](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:compose/ui/ui-graphics/src/androidMain/kotlin/androidx/compose/ui/graphics/CanvasUtils.android.kt;drc=3b2dde134afab8d58b9c39ad4820eaf9a6e014a9)
 */
internal object CanvasUtil {
  private var reorderBarrierMethod: Method? = null
  private var inorderBarrierMethod: Method? = null
  private var orderMethodsFetched = false

  /**
   * Enables Z support for the Canvas. The method is publicly available starting from API 29 and was
   * hidden before, so we have to resort to reflection tricks to ensure we can use this API.
   */
  @SuppressLint("SoonBlockedPrivateApi", "PrivateApi")
  @JvmStatic
  fun enableZ(canvas: Canvas, enable: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      if (enable) {
        canvas.enableZ()
      } else {
        canvas.disableZ()
      }
    } else {
      fetchOrderMethods()
      try {
        if (enable && reorderBarrierMethod != null) {
          checkNotNull(reorderBarrierMethod).invoke(canvas)
        }
        if (!enable && inorderBarrierMethod != null) {
          checkNotNull(inorderBarrierMethod).invoke(canvas)
        }
      } catch (ignore: IllegalAccessException) {
        // Do nothing
      } catch (ignore: InvocationTargetException) {
        // Do nothing
      }
    }
  }

  private fun fetchOrderMethods() {
    if (!orderMethodsFetched) {
      try {
        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
          // use double reflection to avoid grey list on P
          val getDeclaredMethod =
              Class::class
                  .java
                  .getDeclaredMethod(
                      "getDeclaredMethod", String::class.java, Array<Any>::class.java)
          reorderBarrierMethod =
              getDeclaredMethod.invoke(
                  Canvas::class.java, "insertReorderBarrier", arrayOfNulls<Class<*>>(0)) as Method
          inorderBarrierMethod =
              getDeclaredMethod.invoke(
                  Canvas::class.java, "insertInorderBarrier", arrayOfNulls<Class<*>>(0)) as Method
        } else {
          reorderBarrierMethod = Canvas::class.java.getDeclaredMethod("insertReorderBarrier")
          inorderBarrierMethod = Canvas::class.java.getDeclaredMethod("insertInorderBarrier")
        }
        if (reorderBarrierMethod == null || inorderBarrierMethod == null) {
          return
        }
        reorderBarrierMethod?.isAccessible = true
        inorderBarrierMethod?.isAccessible = true
      } catch (ignore: IllegalAccessException) {
        // Do nothing
      } catch (ignore: InvocationTargetException) {
        // Do nothing
      } catch (ignore: NoSuchMethodException) {
        // Do nothing
      }
      orderMethodsFetched = true
    }
  }
}
