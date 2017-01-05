/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

/**
 * Interface used by {@link DeviceEventManagerModule} to delegate hardware back button events. It's
 * suppose to provide a default behavior since it would be triggered in the case when JS side
 * doesn't want to handle back press events.
 */
public interface DefaultHardwareBackBtnHandler {

  /**
   * By default, all onBackPress() calls should not execute the default backpress handler and should
   * instead propagate it to the JS instance. If JS doesn't want to handle the back press itself,
   * it shall call back into native to invoke this function which should execute the default handler
   */
  void invokeDefaultOnBackPressed();
}
