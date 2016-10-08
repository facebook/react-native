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
 * A context wrapper that always wraps Android Application {@link Context} and
 * {@link CatalystInstance} by extending {@link ReactContext}
 */
public class ReactApplicationContext extends ReactContext {
  // We want to wrap ApplicationContext, since there is no easy way to verify that application
  // context is passed as a param, we use {@link Context#getApplicationContext} to ensure that
  // the context we're wrapping is in fact an application context.
  public ReactApplicationContext(Context context) {
    super(context.getApplicationContext());
  }
}
