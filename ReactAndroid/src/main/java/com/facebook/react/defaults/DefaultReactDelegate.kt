/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.app.Activity
import android.os.Bundle
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView

/**
 * A utility class that allows you to simplify the setup of a [ReactDelegate] for new apps
 * in Open Source.
 *
 * Specifically, with this class you can simply control if Fabric is enabled for an Activity using
 * the boolean flag in the constructor.
 *
 * @param fabricEnabled Whether Fabric should be enabled for the RootView of this Activity.
 */
open class DefaultReactDelegate(
    activity: Activity,
    reactNativeHost: ReactNativeHost,
    appKey: String?,
    launchOptions: Bundle?,
    private val fabricEnabled: Boolean = false,
) : ReactDelegate(activity, reactNativeHost, appKey, launchOptions) {

    override fun isFabricEnabled(): Boolean = fabricEnabled

    override fun createRootView(): ReactRootView =
        ReactRootView(context).apply { setIsFabric(fabricEnabled) }
}
