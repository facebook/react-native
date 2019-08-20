/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.content.Context;

/**
 * Base class for React native modules that require access to an Android {@link Context} instance.
 */
public abstract class ContextBaseJavaModule extends BaseJavaModule {

  private final Context mContext;

  public ContextBaseJavaModule(Context context) {
    mContext = context;
  }

  /** Subclasses can use this method to access Android context passed as a constructor */
  protected final Context getContext() {
    return mContext;
  }
}
