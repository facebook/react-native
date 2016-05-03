/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * A utility for getting the MessageQueueThread for the current thread. Once there is only one
 * implementation of MessageQueueThread, this should move to that class.
 */
@DoNotStrip
public class MessageQueueThreadRegistry {

  private static ThreadLocal<MessageQueueThread> sMyMessageQueueThread = new ThreadLocal<>();

  /*package*/ static void register(MessageQueueThread mqt) {
    mqt.assertIsOnThread();
    sMyMessageQueueThread.set(mqt);
  }

  /**
   * @return the MessageQueueThread that owns the current Thread.
   */
  @DoNotStrip
  public static MessageQueueThread myMessageQueueThread() {
    return Assertions.assertNotNull(
        sMyMessageQueueThread.get(),
        "This thread doesn't have a MessageQueueThread registered to it!");
  }
}

