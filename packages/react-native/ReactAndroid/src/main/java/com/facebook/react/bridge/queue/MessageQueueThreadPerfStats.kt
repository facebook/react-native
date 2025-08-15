/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

/** This class holds perf counters' values at the beginning of an RN startup. */
@Deprecated("MessageQueueThread perf stats are no longer collected")
public class MessageQueueThreadPerfStats {
  @JvmField public var wallTime: Long = 0
  @JvmField public var cpuTime: Long = 0
}
