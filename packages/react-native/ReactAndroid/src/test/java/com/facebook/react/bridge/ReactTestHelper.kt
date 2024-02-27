/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.bridge.queue.MessageQueueThreadSpec
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec
import com.facebook.react.uimanager.UIManagerModule
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RuntimeEnvironment

/** Utility for creating pre-configured instances of core react components for tests. */
object ReactTestHelper {
  /**
   * @return a ReactApplicationContext that has a CatalystInstance mock returned by
   *   [createMockCatalystInstance]
   */
  @JvmStatic
  fun createCatalystContextForTest(): ReactApplicationContext =
      BridgeReactContext(RuntimeEnvironment.getApplication()).apply {
        initialize(createMockCatalystInstance())
      }

  /** @return a CatalystInstance mock that has a default working ReactQueueConfiguration. */
  @JvmStatic
  fun createMockCatalystInstance(): CatalystInstance {
    val spec: ReactQueueConfigurationSpec =
        ReactQueueConfigurationSpec.builder()
            .setJSQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .setNativeModulesQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .build()
    val reactQueueConfiguration: ReactQueueConfiguration =
        ReactQueueConfigurationImpl.create(spec) { e -> throw RuntimeException(e) }
    val reactInstance: CatalystInstance = mock(CatalystInstance::class.java)
    whenever(reactInstance.getReactQueueConfiguration()).thenReturn(reactQueueConfiguration)
    whenever(reactInstance.getNativeModule(UIManagerModule::class.java))
        .thenReturn(mock(UIManagerModule::class.java))
    whenever(reactInstance.isDestroyed()).thenReturn(false)
    return reactInstance
  }
}
