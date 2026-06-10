/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager

internal class PackagerConnectionStatusNotifier(
    private val devLoadingViewManagerProvider: () -> DevLoadingViewManager?,
    private val postDelayed: (Runnable, Long) -> Unit = { runnable, delayMs ->
      UiThreadUtil.runOnUiThread(runnable, delayMs)
    },
) {
  private var hasConnected = false
  private var connectionLost = false
  private var reconnectMessageToken = 0

  @Synchronized
  fun onPackagerConnected() {
    if (connectionLost) {
      val devLoadingViewManager = devLoadingViewManagerProvider()
      if (devLoadingViewManager != null) {
        devLoadingViewManager.showMessage(RECONNECTED_MESSAGE)

        val token = ++reconnectMessageToken
        postDelayed(
            Runnable {
              synchronized(this) {
                if (!connectionLost && reconnectMessageToken == token) {
                  devLoadingViewManager.hide()
                }
              }
            },
            RECONNECTED_MESSAGE_HIDE_DELAY_MS,
        )
      }
    }
    hasConnected = true
    connectionLost = false
  }

  @Synchronized
  fun onPackagerDisconnected() {
    if (hasConnected && !connectionLost) {
      connectionLost = true
      reconnectMessageToken++
      devLoadingViewManagerProvider()?.showMessage(CONNECTION_LOST_MESSAGE)
    }
  }

  @Synchronized
  fun onPackagerConnectionClosed() {
    hasConnected = false
    connectionLost = false
    reconnectMessageToken++
  }

  private companion object {
    const val CONNECTION_LOST_MESSAGE = "Connection to Metro lost. Retrying..."
    const val RECONNECTED_MESSAGE = "Reconnected to Metro."
    const val RECONNECTED_MESSAGE_HIDE_DELAY_MS = 2_000L
  }
}
