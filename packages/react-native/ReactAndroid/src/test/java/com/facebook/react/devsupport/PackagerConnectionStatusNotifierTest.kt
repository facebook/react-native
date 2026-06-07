/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class PackagerConnectionStatusNotifierTest {

  private val devLoadingViewManager = RecordingDevLoadingViewManager()
  private val notifier = PackagerConnectionStatusNotifier(devLoadingViewManager)

  @Test
  fun testInitialConnectionDoesNotShowReconnectedMessage() {
    notifier.onPackagerConnected()

    assertThat(devLoadingViewManager.messages).isEmpty()
  }

  @Test
  fun testLostConnectionShowsRetryingOnceUntilReconnect() {
    notifier.onPackagerConnected()

    notifier.onPackagerDisconnected()
    notifier.onPackagerDisconnected()

    assertThat(devLoadingViewManager.messages)
        .containsExactly("Connection to Metro lost. Retrying...")
  }

  @Test
  fun testReconnectAfterLossShowsReconnectedMessage() {
    notifier.onPackagerConnected()
    notifier.onPackagerDisconnected()

    notifier.onPackagerConnected()

    assertThat(devLoadingViewManager.messages)
        .containsExactly("Connection to Metro lost. Retrying...", "Reconnected to Metro.")
  }

  private class RecordingDevLoadingViewManager : DevLoadingViewManager {
    val messages = mutableListOf<String>()

    override fun showMessage(message: String) {
      messages.add(message)
    }

    override fun showMessage(
        message: String,
        color: Double?,
        backgroundColor: Double?,
        dismissButton: Boolean?,
    ) {
      messages.add(message)
    }

    override fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?) = Unit

    override fun hide() = Unit
  }
}
