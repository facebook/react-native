/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import android.content.Context;

/**
 * Base class for React native modules that require access to an Android
 * {@link Context} instance.
 */
public abstract class ContextBaseJavaModule extends BaseJavaModule {

  private final Context mContext;

  public ContextBaseJavaModule(Context context) {
    mContext = context;
  }

  /**
   * Subclasses can use this method to access Android context passed as a constructor
   */
  protected final Context getContext() {
    return mContext;
  }
}
