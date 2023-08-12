/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common;

import android.content.Context;
import android.content.ContextWrapper;
import androidx.annotation.Nullable;

/**
 * Class containing static methods involving manipulations of Contexts and their related subclasses.
 */
public class ContextUtils {

  /**
   * Returns the nearest context in the chain (as defined by ContextWrapper.getBaseContext()) which
   * is an instance of the specified type, or null if one could not be found
   *
   * @param context Initial context
   * @param clazz Class instance to look for
   * @param <T>
   * @return the first context which is an instance of the specified class, or null if none exists
   */
  public static @Nullable <T> T findContextOfType(
      @Nullable Context context, Class<? extends T> clazz) {
    while (!(clazz.isInstance(context))) {
      if (context instanceof ContextWrapper) {
        Context baseContext = ((ContextWrapper) context).getBaseContext();
        if (context == baseContext) {
          return null;
        } else {
          context = baseContext;
        }
      } else {
        return null;
      }
    }
    return (T) context;
  }
}
