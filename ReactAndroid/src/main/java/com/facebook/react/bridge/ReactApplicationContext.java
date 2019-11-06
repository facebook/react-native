/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.Context;

/**
 * A context wrapper that always wraps Android Application {@link Context} and {@link
 * CatalystInstance} by extending {@link ReactContext}
 */
public class ReactApplicationContext extends ReactContext {
  // We want to wrap ApplicationContext, since there is no easy way to verify that application
  // context is passed as a param, we use {@link Context#getApplicationContext} to ensure that
  // the context we're wrapping is in fact an application context.
  public ReactApplicationContext(Context context) {
    super(context.getApplicationContext());
  }

  /**
   * A constructor that takes a unique string identifier for the React instance. For bridgeless mode
   * only - do not use.
   *
   * <p>TODO T43898341 Make this package-private once we've consolidated the classes that need this
   * in this package
   */
  public ReactApplicationContext(Context context, String instanceKey) {
    super(context.getApplicationContext(), instanceKey);
  }
}
