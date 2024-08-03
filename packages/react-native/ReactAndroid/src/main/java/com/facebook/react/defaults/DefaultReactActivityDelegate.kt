/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView

/**
 * A utility class that allows you to simplify the setup of a [ReactActivityDelegate] for new apps
 * in Open Source.
 *
 * Specifically, with this class you can simply control if Fabric is enabled for an Activity using
 * the boolean flag in the constructor.
 *
 * @param fabricEnabled Whether Fabric should be enabled for the RootView of this Activity.
 */
public open class DefaultReactActivityDelegate(
    activity: ReactActivity,
    mainComponentName: String,
    private val fabricEnabled: Boolean = false,
) : ReactActivityDelegate(activity, mainComponentName) {

  @Deprecated(
      message =
          "Creating DefaultReactActivityDelegate with both fabricEnabled and " +
              "concurrentReactEnabled is deprecated. Please pass only one boolean value that will" +
              " be used for both flags",
      level = DeprecationLevel.WARNING,
      replaceWith =
          ReplaceWith("DefaultReactActivityDelegate(activity, mainComponentName, fabricEnabled)"))
  public constructor(
      activity: ReactActivity,
      mainComponentName: String,
      fabricEnabled: Boolean,
      @Suppress("UNUSED_PARAMETER") concurrentReactEnabled: Boolean,
  ) : this(activity, mainComponentName, fabricEnabled)

  override fun isFabricEnabled(): Boolean = fabricEnabled

  override fun createRootView(): ReactRootView =
      ReactRootView(context).apply { setIsFabric(fabricEnabled) }

  override fun createRootView(bundle: Bundle?): ReactRootView =
      ReactRootView(context).apply { setIsFabric(fabricEnabled) }
}
