/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import com.squareup.okhttp.Interceptor;

/**
 * Classes implementing this interface return a new {@link Interceptor} when the {@link #create}
 * method is called.
 */
public interface NetworkInterceptorCreator {
  Interceptor create();
}
