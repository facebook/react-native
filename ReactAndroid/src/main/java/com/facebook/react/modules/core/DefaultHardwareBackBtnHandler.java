/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
   * instead propagate it to the JS instance. If JS doesn't want to handle the back press itself, it
   * shall call back into native to invoke this function which should execute the default handler
   */
  void invokeDefaultOnBackPressed();
}
