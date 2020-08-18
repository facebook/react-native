/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

/** This class holds perf counters' values at the beginning of an RN startup. */
public class MessageQueueThreadPerfStats {
  public long wallTime;
  public long cpuTime;
}
