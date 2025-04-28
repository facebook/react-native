/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.view.KeyEvent
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

/** Base Activity for React Native applications. */
public abstract class ReactActivity protected constructor() :
    AppCompatActivity(), DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  public open val reactActivityDelegate: ReactActivityDelegate = createReactActivityDelegate()

  public open val reactDelegate: ReactDelegate?
    get() = reactActivityDelegate.reactDelegate

  protected open val reactHost: ReactHost?
    get() = reactActivityDelegate.reactHost

  protected val reactNativeHost: ReactNativeHost
    get() = reactActivityDelegate.reactNativeHost

  protected val reactInstanceManager: ReactInstanceManager
    get() = reactActivityDelegate.reactInstanceManager

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component. e.g. "MoviesApp"
   */
  protected open val mainComponentName: String?
    get() = null

  /** Called at construction time, override if you have a custom delegate implementation. */
  protected open fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegate(this, mainComponentName)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    reactActivityDelegate.onCreate(savedInstanceState)
  }

  override fun onPause() {
    super.onPause()
    reactActivityDelegate.onPause()
  }

  override fun onResume() {
    super.onResume()
    reactActivityDelegate.onResume()
  }

  override fun onDestroy() {
    super.onDestroy()
    reactActivityDelegate.onDestroy()
  }

  override public fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    reactActivityDelegate.onActivityResult(requestCode, resultCode, data)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean =
      reactActivityDelegate.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event)

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean =
      reactActivityDelegate.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event)

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean =
      reactActivityDelegate.onKeyLongPress(keyCode, event) || super.onKeyLongPress(keyCode, event)

  @Suppress("DEPRECATION")
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    if (!reactActivityDelegate.onBackPressed()) {
      super.onBackPressed()
    }
  }

  override fun invokeDefaultOnBackPressed() {
    @Suppress("DEPRECATION") super.onBackPressed()
  }

  override public fun onNewIntent(intent: Intent) {
    if (!reactActivityDelegate.onNewIntent(intent)) {
      super.onNewIntent(intent)
    }
  }

  override public fun onUserLeaveHint() {
    super.onUserLeaveHint()
    reactActivityDelegate.onUserLeaveHint()
  }

  override fun requestPermissions(
      permissions: Array<String>,
      requestCode: Int,
      listener: PermissionListener?
  ) {
    reactActivityDelegate.requestPermissions(permissions, requestCode, listener)
  }

  override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<String>,
      grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    reactActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults)
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    reactActivityDelegate.onWindowFocusChanged(hasFocus)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    reactActivityDelegate.onConfigurationChanged(newConfig)
  }

  protected fun loadApp(appKey: String?) {
    reactActivityDelegate.loadApp(appKey)
  }
}
