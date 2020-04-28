/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager.events;

public interface BatchEventDispatchedListener {

  /** Called after a batch of low priority events has been dispatched. */
  void onBatchEventDispatched();
}
