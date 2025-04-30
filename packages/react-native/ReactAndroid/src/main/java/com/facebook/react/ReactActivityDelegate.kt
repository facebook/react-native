/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactContext
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.modules.core.PermissionListener
import com.facebook.systrace.Systrace

/**
 * Delegate class for [ReactActivity]. You can subclass this to provide custom implementations for
 * e.g. [.getReactNativeHost], if your Application class doesn't implement [ ].
 */
public open class ReactActivityDelegate {
  private val activity: ReactActivity?
  private val mainComponentName: String?

  private var permissionListener: PermissionListener? = null
  private var permissionsCallback: Callback? = null
  internal var reactDelegate: ReactDelegate? = null
    private set

  protected open val launchOptions: Bundle?
    /**
     * Public API to populate the launch options that will be passed to React. Here you can
     * customize the values that will be passed as `initialProperties` to the Renderer.
     *
     * @return Either null or a key-value map as a Bundle
     */
    get() = null

  @Deprecated("Use reactHost in New Architecture")
  internal open val reactNativeHost: ReactNativeHost
    /**
     * Get the [ReactNativeHost] used by this app with Bridge enabled. By default, assumes
     * [Activity.getApplication] is an instance of [ReactApplication] and calls
     * [ ][ReactApplication.getReactNativeHost]. Override this method if your application class does
     * not implement `ReactApplication` or you simply have a different mechanism for storing a
     * `ReactNativeHost`, e.g. as a static field somewhere.
     */
    get() = (plainActivity.getApplication() as ReactApplication).reactNativeHost

  public open val reactHost: ReactHost?
    /**
     * Get the [ReactHost] used by this app with Bridgeless enabled. By default, assumes
     * [ ][Activity.getApplication] is an instance of [ReactApplication] and calls
     * [ ][ReactApplication.getReactHost]. Override this method if your application class does not
     * implement `ReactApplication` or you simply have a different mechanism for storing a
     * `ReactHost`, e.g. as a static field somewhere.
     */
    get() = (plainActivity.getApplication() as ReactApplication).reactHost

  /**
   * Prefer using ReactActivity when possible, as it hooks up all Activity lifecycle methods by
   * default. It also implements DefaultHardwareBackBtnHandler, which ReactDelegate requires.
   */
  @Deprecated("")
  public constructor(activity: Activity?, mainComponentName: String?) {
    this.activity = activity as? ReactActivity
    this.mainComponentName = mainComponentName
  }

  public constructor(activity: ReactActivity?, mainComponentName: String?) {
    this.activity = activity
    this.mainComponentName = mainComponentName
  }

  protected open fun composeLaunchOptions(): Bundle? = launchOptions

  /**
   * Override to customize ReactRootView creation.
   *
   * Not used on bridgeless
   */
  protected open fun createRootView(): ReactRootView? = null

  @Deprecated("Use reactHost in New Architecture")
  public open val reactInstanceManager: ReactInstanceManager
    get() = checkNotNull(reactDelegate).reactInstanceManager

  public open fun onCreate(savedInstanceState: Bundle?) {
    Systrace.traceSection(Systrace.TRACE_TAG_REACT, "ReactActivityDelegate.onCreate::init") {
      val mainComponentName = mainComponentName
      val launchOptions: Bundle? = composeLaunchOptions()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isWideColorGamutEnabled) {
        activity?.getWindow()?.setColorMode(ActivityInfo.COLOR_MODE_WIDE_COLOR_GAMUT)
      }
      if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
        reactDelegate = ReactDelegate(plainActivity, reactHost, mainComponentName, launchOptions)
      } else {
        @Suppress("DEPRECATION")
        reactDelegate =
            object :
                ReactDelegate(
                    plainActivity,
                    reactNativeHost,
                    mainComponentName,
                    launchOptions,
                    isFabricEnabled) {
              override fun createRootView(): ReactRootView {
                var rootView = this@ReactActivityDelegate.createRootView()
                if (rootView == null) {
                  rootView = super.createRootView()
                }
                return rootView
              }
            }
      }
      if (mainComponentName != null) {
        loadApp(mainComponentName)
      }
    }
  }

  public fun loadApp(appKey: String?) {
    reactDelegate?.loadApp(appKey)
    plainActivity.setContentView(reactDelegate?.reactRootView)
  }

  public open fun setReactSurface(reactSurface: ReactSurface?) {
    reactDelegate?.setReactSurface(reactSurface)
  }

  public open fun setReactRootView(reactRootView: ReactRootView?) {
    reactDelegate?.reactRootView = reactRootView
  }

  public open fun onUserLeaveHint() {
    reactDelegate?.onUserLeaveHint()
  }

  public open fun onPause() {
    reactDelegate?.onHostPause()
  }

  public open fun onResume() {
    reactDelegate?.onHostResume()
    permissionsCallback?.invoke()
    permissionsCallback = null
  }

  public open fun onDestroy() {
    reactDelegate?.onHostDestroy()
  }

  public open fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    reactDelegate?.onActivityResult(requestCode, resultCode, data, true)
  }

  public open fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean =
      reactDelegate?.onKeyDown(keyCode, event) ?: false

  public open fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean =
      reactDelegate?.shouldShowDevMenuOrReload(keyCode, event) ?: false

  public open fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean =
      reactDelegate?.onKeyLongPress(keyCode) ?: false

  public open fun onBackPressed(): Boolean = reactDelegate?.onBackPressed() ?: false

  public open fun onNewIntent(intent: Intent?): Boolean =
      reactDelegate?.onNewIntent(intent) ?: false

  public open fun onWindowFocusChanged(hasFocus: Boolean) {
    reactDelegate?.onWindowFocusChanged(hasFocus)
  }

  public open fun onConfigurationChanged(newConfig: Configuration?) {
    reactDelegate?.onConfigurationChanged(newConfig)
  }

  public open fun requestPermissions(
      permissions: Array<String>?,
      requestCode: Int,
      listener: PermissionListener?
  ) {
    permissionListener = listener
    if (permissions != null) {
      plainActivity?.requestPermissions(permissions, requestCode)
    }
  }

  public open fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<String>?,
      grantResults: IntArray?
  ) {
    permissionsCallback = Callback { _ ->
      if (permissions != null &&
          grantResults != null &&
          permissionListener?.onRequestPermissionsResult(requestCode, permissions, grantResults)
              ?: false) {
        permissionListener = null
      }
    }
  }

  protected open val context: Context
    get() = checkNotNull(activity) as Context

  protected open val plainActivity: Activity
    get() = (context as Activity)

  protected open val reactActivity: ReactActivity
    get() = (context as ReactActivity)

  public val currentReactContext: ReactContext?
    /**
     * Get the current [ReactContext] from ReactHost or ReactInstanceManager
     *
     * Do not store a reference to this, if the React instance is reloaded or destroyed, this
     * context will no longer be valid.
     */
    get() = reactDelegate?.currentReactContext

  protected open val isFabricEnabled: Boolean
    /**
     * Override this method if you wish to selectively toggle Fabric for a specific surface. This
     * will also control if Concurrent Root (React 18) should be enabled or not.
     *
     * @return true if Fabric is enabled for this Activity, false otherwise.
     */
    get() = ReactNativeNewArchitectureFeatureFlags.enableFabricRenderer()

  protected open val isWideColorGamutEnabled: Boolean
    /**
     * Override this method if you wish to selectively toggle wide color gamut for a specific
     * surface.
     *
     * @return true if wide gamut is enabled for this Activity, false otherwise.
     */
    get() = false
}
