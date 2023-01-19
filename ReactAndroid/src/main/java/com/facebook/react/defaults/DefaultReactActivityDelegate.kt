/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView

/**
 * A utility class that allows you to simplify the setup of a [ReactActivityDelegate] for new apps
 * in Open Source.
 *
 * Specifically, with this class you can simply control if Fabric and Concurrent Root are enabled
 * for an Activity using the boolean flags in the constructor.
 *
 * @param fabricEnabled Whether Fabric should be enabled for the RootView of this Activity.
 * @param concurrentRootEnabled Whether ConcurrentRoot (aka React 18) should be enabled for the
 *   RootView of this Activity.
 */
open class DefaultReactActivityDelegate(
    activity: ReactActivity,
    mainComponentName: String,
    private val fabricEnabled: Boolean = false,
    private val concurrentRootEnabled: Boolean = false
) : ReactActivityDelegate(activity, mainComponentName) {

  /**
   * Override this method to enable Concurrent Root on the surface for this Activity. See:
   * https://reactjs.org/blog/2022/03/29/react-v18.html
   *
   * This requires to be rendering on Fabric (i.e. on the New Architecture).
   *
   * @return Whether you want to enable Concurrent Root for this surface or not.
   */
  override fun isConcurrentRootEnabled(): Boolean {
    return concurrentRootEnabled
  }

  override fun createRootView(): ReactRootView =
      ReactRootView(context).apply { setIsFabric(fabricEnabled) }
}
