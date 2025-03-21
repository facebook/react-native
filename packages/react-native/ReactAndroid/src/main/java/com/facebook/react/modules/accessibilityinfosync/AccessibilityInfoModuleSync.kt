/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfosync

import android.annotation.TargetApi
import android.content.Context
import android.os.Build
import android.view.accessibility.AccessibilityManager
import com.facebook.fbreact.specs.NativeAccessibilityInfoSyncSpec
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeAccessibilityInfoSyncSpec.NAME)
internal class AccessibilityInfoModuleSync(context: ReactApplicationContext) :
    NativeAccessibilityInfoSyncSpec(context), LifecycleEventListener {
  private inner class ReactTouchExplorationStateChangeListener :
      AccessibilityManager.TouchExplorationStateChangeListener {
    override fun onTouchExplorationStateChanged(enabled: Boolean) {
      updateAndSendTouchExplorationChangeEvent(enabled)
    }
  }

  // Android can listen for accessibility service enable with `accessibilityStateChange`, but
  // `accessibilityState` conflicts with React Native props and confuses developers. Therefore, the
  // name `accessibilityServiceChange` is used here instead.
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private inner class ReactAccessibilityServiceChangeListener :
      AccessibilityManager.AccessibilityStateChangeListener {
    override fun onAccessibilityStateChanged(enabled: Boolean) {
      updateAndSendAccessibilityServiceChangeEvent(enabled)
    }
  }

  private fun updateAndSendAccessibilityServiceChangeEvent(enabled: Boolean) {
    if (accessibilityServiceEnabled != enabled) {
      accessibilityServiceEnabled = enabled
      val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
      if (reactApplicationContext != null) {
        getReactApplicationContext()
            .emitDeviceEvent(ACCESSIBILITY_SERVICE_EVENT_NAME, accessibilityServiceEnabled)
      }
    }
  }

  private fun updateAndSendTouchExplorationChangeEvent(enabled: Boolean) {
    if (touchExplorationEnabled != enabled) {
      touchExplorationEnabled = enabled
      val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
      if (reactApplicationContext != null) {
        getReactApplicationContext()
            .emitDeviceEvent(TOUCH_EXPLORATION_EVENT_NAME, touchExplorationEnabled)
      }
    }
  }

  private val accessibilityManager: AccessibilityManager
  private val touchExplorationStateChangeListener: ReactTouchExplorationStateChangeListener =
      ReactTouchExplorationStateChangeListener()
  private val accessibilityServiceChangeListener: ReactAccessibilityServiceChangeListener =
      ReactAccessibilityServiceChangeListener()

  private var touchExplorationEnabled = false
  private var accessibilityServiceEnabled = false

  init {
    val appContext = context.applicationContext
    accessibilityManager =
        appContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
    touchExplorationEnabled = accessibilityManager.isTouchExplorationEnabled
  }

  override fun isTouchExplorationEnabled(): Boolean {
    return accessibilityManager.isTouchExplorationEnabled
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  override fun onHostResume() {
    accessibilityManager.addTouchExplorationStateChangeListener(touchExplorationStateChangeListener)
    updateAndSendTouchExplorationChangeEvent(accessibilityManager.isTouchExplorationEnabled)
  }

  override fun onHostPause() {
    accessibilityManager.removeTouchExplorationStateChangeListener(
        touchExplorationStateChangeListener)
    accessibilityManager.removeAccessibilityStateChangeListener(accessibilityServiceChangeListener)
  }

  override fun onHostDestroy(): Unit = Unit

  override fun invalidate() {
    getReactApplicationContext().removeLifecycleEventListener(this)
    super.invalidate()
  }

  override fun initialize() {
    getReactApplicationContext().addLifecycleEventListener(this)
    updateAndSendTouchExplorationChangeEvent(accessibilityManager.isTouchExplorationEnabled)
    updateAndSendAccessibilityServiceChangeEvent(accessibilityManager.isEnabled)
  }

  companion object {
    const val NAME: String = NativeAccessibilityInfoSyncSpec.NAME
    private const val TOUCH_EXPLORATION_EVENT_NAME = "touchExplorationDidChange"
    private const val ACCESSIBILITY_SERVICE_EVENT_NAME = "accessibilityServiceDidChange"
  }
}
