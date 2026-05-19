/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

public interface RequestHandler {
  public fun onRequest(params: Any?, responder: Responder)

  public fun onNotification(params: Any?)
}
