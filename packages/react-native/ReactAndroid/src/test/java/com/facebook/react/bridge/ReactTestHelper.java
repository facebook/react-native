/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.facebook.react.bridge.queue.MessageQueueThreadSpec;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.uimanager.UIManagerModule;
import org.robolectric.RuntimeEnvironment;

/** Utility for creating pre-configured instances of core react components for tests. */
public class ReactTestHelper {

  /**
   * @return a ReactApplicationContext that has a CatalystInstance mock returned by {@link
   *     #createMockCatalystInstance}
   */
  public static ReactApplicationContext createCatalystContextForTest() {
    ReactApplicationContext context = new ReactApplicationContext(RuntimeEnvironment.application);
    context.initializeWithInstance(createMockCatalystInstance());
    return context;
  }

  /** @return a CatalystInstance mock that has a default working ReactQueueConfiguration. */
  public static CatalystInstance createMockCatalystInstance() {
    ReactQueueConfigurationSpec spec =
        ReactQueueConfigurationSpec.builder()
            .setJSQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .setNativeModulesQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .build();
    ReactQueueConfiguration ReactQueueConfiguration =
        ReactQueueConfigurationImpl.create(
            spec,
            new QueueThreadExceptionHandler() {
              @Override
              public void handleException(Exception e) {
                throw new RuntimeException(e);
              }
            });

    CatalystInstance reactInstance = mock(CatalystInstance.class);
    when(reactInstance.getReactQueueConfiguration()).thenReturn(ReactQueueConfiguration);
    when(reactInstance.getNativeModule(UIManagerModule.class))
        .thenReturn(mock(UIManagerModule.class));
    when(reactInstance.isDestroyed()).thenReturn(false);

    return reactInstance;
  }
}
