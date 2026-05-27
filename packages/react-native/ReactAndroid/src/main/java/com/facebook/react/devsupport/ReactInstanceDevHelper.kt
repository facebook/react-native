/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.view.View
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.TaskInterface

/**
 * Interface used by [DevSupportManager] for accessing some fields and methods of
 * [com.facebook.react.ReactHost] for the purpose of displaying and handling developer menu options.
 */
public interface ReactInstanceDevHelper {

  /** Get reference to top level [Activity] attached to react context */
  public val currentActivity: Activity?

  public val javaScriptExecutorFactory: JavaScriptExecutorFactory

  public val currentReactContext: ReactContext?

  /** Notify react instance manager about new JS bundle version downloaded from the server. */
  public fun onJSBundleLoadedFromServer()

  /** Request to toggle the react element inspector. */
  public fun toggleElementInspector()

  public fun createRootView(appKey: String): View?

  public fun destroyRootView(rootView: View)

  public fun reload(reason: String)

  public fun loadBundle(bundleLoader: JSBundleLoader): TaskInterface<Boolean>
}
