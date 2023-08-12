/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import okhttp3.Interceptor;

/**
 * Classes implementing this interface return a new {@link Interceptor} when the {@link #create}
 * method is called.
 */
public interface NetworkInterceptorCreator {
  Interceptor create();
}
