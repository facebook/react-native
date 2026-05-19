/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import okhttp3.internal.ws.RealWebSocket
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class CxxInspectorPackagerConnectionTest {

  @Test
  fun testMaxQueueSizeEquality() {
    val okHttpRealWebSocketClass = RealWebSocket::class.java
    val okHttpMaxQueueSizeField = okHttpRealWebSocketClass.getDeclaredField("MAX_QUEUE_SIZE")
    okHttpMaxQueueSizeField.isAccessible = true

    val okHttpMaxQueueSize = okHttpMaxQueueSizeField.getLong(null)
    assertThat(okHttpMaxQueueSize).isNotNull

    assertThat(okHttpMaxQueueSize)
        .isEqualTo(CxxInspectorPackagerConnection.Companion.MAX_QUEUE_SIZE)
  }
}
