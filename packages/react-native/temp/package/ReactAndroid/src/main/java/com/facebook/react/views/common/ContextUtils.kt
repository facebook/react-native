/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common

import android.content.Context
import android.content.ContextWrapper

/**
 * Class containing static methods involving manipulations of Contexts and their related subclasses.
 */
public object ContextUtils {

  /**
   * Returns the nearest context in the chain (as defined by ContextWrapper.getBaseContext()) which
   * is an instance of the specified type, or null if one could not be found
   *
   * @param context Initial context
   * @param clazz Class instance to look for
   * @return the first context which is an instance of the specified class, or null if none exists
   */
  @JvmStatic
  public fun <T> findContextOfType(context: Context?, clazz: Class<out T>): T? {
    var currentContext = context
    while (!clazz.isInstance(currentContext)) {
      if (currentContext is ContextWrapper) {
        val baseContext = currentContext.baseContext
        if (currentContext === baseContext) {
          return null
        } else {
          currentContext = baseContext
        }
      } else {
        return null
      }
    }
    @Suppress("UNCHECKED_CAST") return currentContext as T?
  }
}
