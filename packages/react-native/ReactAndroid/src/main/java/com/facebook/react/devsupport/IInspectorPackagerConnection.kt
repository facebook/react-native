/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

internal interface IInspectorPackagerConnection {
  fun connect()

  fun closeQuietly()

  fun sendEventToAllConnections(event: String?)
}
