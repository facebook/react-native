/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.devsupport.interfaces.DevLoadingViewManager

internal class PackagerConnectionStatusNotifier(
    private val devLoadingViewManager: DevLoadingViewManager?
) {
  private var hasConnected = false
  private var connectionLost = false

  fun onPackagerConnected() {
    if (connectionLost) {
      devLoadingViewManager?.showMessage(RECONNECTED_MESSAGE)
    }
    hasConnected = true
    connectionLost = false
  }

  fun onPackagerDisconnected() {
    if (hasConnected && !connectionLost) {
      connectionLost = true
      devLoadingViewManager?.showMessage(CONNECTION_LOST_MESSAGE)
    }
  }

  private companion object {
    const val CONNECTION_LOST_MESSAGE = "Connection to Metro lost. Retrying..."
    const val RECONNECTED_MESSAGE = "Reconnected to Metro."
  }
}
