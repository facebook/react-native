/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class RNTesterActivity : ReactActivity() {
  class RNTesterActivityDelegate(val activity: ReactActivity, mainComponentName: String) :
      DefaultReactActivityDelegate(activity, mainComponentName, fabricEnabled) {
    private val PARAM_ROUTE = "route"
    private lateinit var initialProps: Bundle

    override fun onCreate(savedInstanceState: Bundle?) {
      // Get remote param before calling super which uses it
      val bundle = activity.getIntent()?.getExtras()

      if (bundle != null && bundle.containsKey(PARAM_ROUTE)) {
        val routeUri = "rntester://example/${bundle.getString(PARAM_ROUTE)}Example"
        initialProps = Bundle()
        initialProps?.putString("exampleFromAppetizeParams", routeUri)
      }

      super.onCreate(savedInstanceState)
    }

    override fun getLaunchOptions() =
        if (this::initialProps.isInitialized) initialProps else Bundle()
  }

  override fun createReactActivityDelegate() = RNTesterActivityDelegate(this, mainComponentName)

  override fun getMainComponentName() = "RNTesterApp"
}
