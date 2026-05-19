/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import okhttp3.OkHttpClient

public fun interface CustomClientBuilder {
  public fun apply(builder: OkHttpClient.Builder)
}
