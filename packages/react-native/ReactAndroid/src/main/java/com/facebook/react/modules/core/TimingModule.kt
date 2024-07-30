/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.ReactChoreographer.Companion.instance

/** Native module for JS timer execution. Timers fire on frame boundaries. */
@ReactModule(name = com.facebook.fbreact.specs.NativeTimingSpec.NAME)
public class TimingModule(
    reactContext: ReactApplicationContext?,
    devSupportManager: DevSupportManager?
) : com.facebook.fbreact.specs.NativeTimingSpec(reactContext), JavaScriptTimerExecutor {
  private val javaTimerManager: JavaTimerManager =
      JavaTimerManager(reactContext, this, instance, devSupportManager)

  override fun initialize() {
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(getReactApplicationContext())
    headlessJsTaskContext.addTaskEventListener(javaTimerManager)
  }

  override fun createTimer(
      callbackIDDouble: Double,
      durationDouble: Double,
      jsSchedulingTime: Double,
      repeat: Boolean
  ) {
    val callbackID = callbackIDDouble.toInt()
    val duration = durationDouble.toInt()
    javaTimerManager.createAndMaybeCallTimer(callbackID, duration, jsSchedulingTime, repeat)
  }

  override fun deleteTimer(timerIdDouble: Double) {
    val timerId = timerIdDouble.toInt()
    javaTimerManager.deleteTimer(timerId)
  }

  override fun setSendIdleEvents(sendIdleEvents: Boolean) {
    javaTimerManager.setSendIdleEvents(sendIdleEvents)
  }

  override fun callTimers(timerIDs: WritableArray) {
    val context = getReactApplicationContextIfActiveOrWarn()
    context?.getJSModule(JSTimers::class.java)?.callTimers(timerIDs)
  }

  override fun callIdleCallbacks(frameTime: Double) {
    val context = getReactApplicationContextIfActiveOrWarn()
    context?.getJSModule(JSTimers::class.java)?.callIdleCallbacks(frameTime)
  }

  override fun emitTimeDriftWarning(warningMessage: String) {
    val context = getReactApplicationContextIfActiveOrWarn()
    context?.getJSModule(JSTimers::class.java)?.emitTimeDriftWarning(warningMessage)
  }

  override fun invalidate() {
    val context: ReactApplicationContext = getReactApplicationContext()
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
    headlessJsTaskContext.removeTaskEventListener(javaTimerManager)
    javaTimerManager.onInstanceDestroy()
  }

  @VisibleForTesting
  public fun hasActiveTimersInRange(rangeMs: Long): Boolean =
      javaTimerManager.hasActiveTimersInRange(rangeMs)

  public companion object {
    public const val NAME: String = com.facebook.fbreact.specs.NativeTimingSpec.NAME
  }
}
