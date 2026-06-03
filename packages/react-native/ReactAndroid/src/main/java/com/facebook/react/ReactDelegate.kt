/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.DoubleTapReloadRecognizer
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an [Activity] or a [android.app.Fragment].
 */
@Suppress("DEPRECATION")
public open class ReactDelegate {
  private val activity: Activity
  private var internalReactRootView: ReactRootView? = null
  private val mainComponentName: String?
  private var launchOptions: Bundle?
  private var doubleTapReloadRecognizer: DoubleTapReloadRecognizer?

  @Deprecated(
      "You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.",
      ReplaceWith("reactHost"),
  )
  private var reactNativeHost: ReactNativeHost? = null
  public var reactHost: ReactHost? = null
    private set

  private var reactSurface: ReactSurface? = null

  /**
   * Override this method if you wish to selectively toggle Fabric for a specific surface. This will
   * also control if Concurrent Root (React 18) should be enabled or not.
   *
   * @return true if Fabric is enabled for this Activity, false otherwise.
   */
  protected val isFabricEnabled: Boolean = true

  /**
   * Do not use this constructor as it's not accounting for New Architecture at all. You should use
   * [ReactDelegate(Activity, ReactNativeHost, String, Bundle, boolean)] as it's the constructor
   * used for New Architecture.
   */
  @Deprecated(
      "Use one of the other constructors instead to account for New Architecture. Deprecated since 0.75.0"
  )
  public constructor(
      activity: Activity,
      reactNativeHost: ReactNativeHost?,
      appKey: String?,
      launchOptions: Bundle?,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactNativeHost = reactNativeHost
  }

  public constructor(
      activity: Activity,
      reactHost: ReactHost?,
      appKey: String?,
      launchOptions: Bundle?,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactHost = reactHost
  }

  @Deprecated("Deprecated since 0.81.0, use one of the other constructors instead.")
  public constructor(
      activity: Activity,
      reactNativeHost: ReactNativeHost?,
      appKey: String?,
      launchOptions: Bundle?,
      fabricEnabled: Boolean,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactNativeHost = reactNativeHost
  }

  private val devSupportManager: DevSupportManager?
    get() = reactHost?.devSupportManager

  public fun onHostResume() {
    if (activity !is DefaultHardwareBackBtnHandler) {
      throw ClassCastException(
          "Host Activity `${activity.javaClass.simpleName}` does not implement DefaultHardwareBackBtnHandler"
      )
    }
    reactHost?.onHostResume(activity, activity as DefaultHardwareBackBtnHandler)
  }

  public fun onUserLeaveHint() {
    reactHost?.onHostLeaveHint(activity)
  }

  public fun onHostPause() {
    reactHost?.onHostPause(activity)
  }

  public fun onHostDestroy() {
    unloadApp()
    reactHost?.onHostDestroy(activity)
  }

  public fun onBackPressed(): Boolean {
    return reactHost?.onBackPressed() == true
  }

  public fun onNewIntent(intent: Intent): Boolean {
    if (reactHost != null) {
      reactHost?.onNewIntent(intent)
      return true
    }
    return false
  }

  public fun onActivityResult(
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
      shouldForwardToReactInstance: Boolean,
  ) {
    if (reactHost != null && shouldForwardToReactInstance) {
      reactHost?.onActivityResult(activity, requestCode, resultCode, data)
    }
  }

  public fun onWindowFocusChanged(hasFocus: Boolean) {
    reactHost?.onWindowFocusChange(hasFocus)
  }

  public fun onConfigurationChanged(newConfig: Configuration?) {
    reactHost?.onConfigurationChanged(checkNotNull(activity))
  }

  public fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD && reactHost?.devSupportManager != null) {
      event.startTracking()
      return true
    }
    return false
  }

  public fun onKeyLongPress(keyCode: Int): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || keyCode == KeyEvent.KEYCODE_BACK) {
      val devSupportManager = reactHost?.devSupportManager
      // onKeyLongPress is a Dev API and not supported in RELEASE mode.
      if (devSupportManager != null && devSupportManager !is ReleaseDevSupportManager) {
        devSupportManager.showDevOptionsDialog()
        return true
      }
    }
    return false
  }

  public fun reload() {
    val devSupportManager = devSupportManager ?: return

    // Reload in RELEASE mode
    if (devSupportManager is ReleaseDevSupportManager) {
      // Do not reload the bundle from JS as there is no bundler running in release mode.
      reactHost?.reload("ReactDelegate.reload()")
      return
    }

    // Reload in DEBUG mode
    devSupportManager.handleReloadJS()
  }

  /** Start the React surface with the app key supplied in the [ReactDelegate] constructor. */
  public fun loadApp() {
    val name = requireNotNull(mainComponentName) { "Cannot loadApp without a main component name." }
    loadApp(name)
  }

  /**
   * Start the React surface for the given app key.
   *
   * @param appKey The ID of the app to load into the surface.
   */
  public fun loadApp(appKey: String) {
    val reactHost = reactHost
    if (reactSurface == null && reactHost != null) {
      reactSurface = reactHost.createSurface(activity, appKey, launchOptions)
    }
    reactSurface?.start()
  }

  /** Stop the React surface started with [ReactDelegate.loadApp]. */
  public fun unloadApp() {
    reactSurface?.stop()
    reactSurface = null
  }

  public fun setReactSurface(reactSurface: ReactSurface?) {
    this.reactSurface = reactSurface
  }

  public var reactRootView: ReactRootView?
    get() = reactSurface?.view as ReactRootView?
    set(reactRootView) {
      internalReactRootView = reactRootView
    }

  // Not used in bridgeless
  protected open fun createRootView(): ReactRootView? {
    val reactRootView = ReactRootView(activity)
    reactRootView.setIsFabric(isFabricEnabled)
    return reactRootView
  }

  /**
   * Handles delegating the [Activity.onKeyUp] method to determine whether the application should
   * show the developer menu or should reload the React Application.
   *
   * @return true if we consume the event and either show the develop menu or reloaded the
   *   application.
   */
  public fun shouldShowDevMenuOrReload(keyCode: Int, event: KeyEvent?): Boolean {
    val devSupportManager = devSupportManager
    // shouldShowDevMenuOrReload is a Dev API and not supported in RELEASE mode.
    if (
        devSupportManager == null ||
            !devSupportManager.keyboardShortcutsEnabled ||
            devSupportManager is ReleaseDevSupportManager
    ) {
      return false
    }

    if (keyCode == KeyEvent.KEYCODE_MENU) {
      devSupportManager.showDevOptionsDialog()
      return true
    }
    val didDoubleTapR = doubleTapReloadRecognizer?.didDoubleTapR(keyCode, activity.currentFocus)
    if (didDoubleTapR == true) {
      devSupportManager.handleReloadJS()
      return true
    }
    return false
  }

  @Deprecated(
      "Do not access [ReactInstanceManager] directly. This class is going away in the New Architecture. You should use [ReactHost] instead."
  )
  public fun getReactInstanceManager(): ReactInstanceManager {
    val nonNullReactNativeHost =
        checkNotNull(reactNativeHost) {
          "Cannot get ReactInstanceManager without a ReactNativeHost."
        }
    return nonNullReactNativeHost.reactInstanceManager
  }

  /**
   * Get the current [ReactContext] from [ReactHost].
   *
   * Do not store a reference to this, if the React instance is reloaded or destroyed, this context
   * will no longer be valid.
   */
  public val currentReactContext: ReactContext?
    get() = reactHost?.currentReactContext
}
