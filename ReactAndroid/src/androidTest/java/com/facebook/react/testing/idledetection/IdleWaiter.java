/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing.idledetection;

/** Interface for something that knows how to wait for bridge and UI idle. */
public interface IdleWaiter {

  void waitForBridgeAndUIIdle();
}
