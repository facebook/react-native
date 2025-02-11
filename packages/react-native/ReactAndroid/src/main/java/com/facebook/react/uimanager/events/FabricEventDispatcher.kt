/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.os.Handler
import android.view.Choreographer
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.systrace.Systrace
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.concurrent.Volatile

/**
 * A singleton class that overrides [EventDispatcher] with no-op methods, to be used by callers that
 * expect an EventDispatcher when the instance doesn't exist.
 */
public open class FabricEventDispatcher(reactContext: ReactApplicationContext) :
    EventDispatcher, LifecycleEventListener {
  private val reactEventEmitter: ReactEventEmitter
  private val reactContext: ReactApplicationContext = reactContext
  private val listeners = CopyOnWriteArrayList<EventDispatcherListener>()
  private val postEventDispatchListeners = CopyOnWriteArrayList<BatchEventDispatchedListener>()
  private val currentFrameCallback: ScheduleDispatchFrameCallback = ScheduleDispatchFrameCallback()

  private var isDispatchScheduled = false
  private val dispatchEventsRunnable = Runnable {
    isDispatchScheduled = false
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "BatchEventDispatchedListeners")
    try {
      for (listener in postEventDispatchListeners) {
        listener.onBatchEventDispatched()
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
    }
  }

  init {
    this.reactContext.addLifecycleEventListener(this)
    reactEventEmitter = ReactEventEmitter(this.reactContext)
  }

  public override fun dispatchEvent(event: Event<*>) {
    for (listener in listeners) {
      listener.onEventDispatch(event)
    }
    if (event.experimental_isSynchronous()) {
      dispatchSynchronous(event)
    } else {
      event.dispatchModern(reactEventEmitter)
    }

    event.dispose()
    scheduleDispatchOfBatchedEvents()
  }

  private fun dispatchSynchronous(event: Event<*>) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricEventDispatcher.dispatchSynchronous('" + event.eventName + "')")
    try {
      val fabricUIManager: UIManager? =
          UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
      @Suppress("DEPRECATION")
      if (fabricUIManager is SynchronousEventReceiver) {
        @Suppress("DEPRECATION")
        (fabricUIManager as SynchronousEventReceiver).receiveEvent(
            event.surfaceId,
            event.viewTag,
            event.eventName,
            event.canCoalesce(),
            event.eventData,
            event.eventCategory,
            true)
      } else {
        ReactSoftExceptionLogger.logSoftException(
            "FabricEventDispatcher",
            ReactNoCrashSoftException(
                "Fabric UIManager expected to implement SynchronousEventReceiver."))
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
    }
  }

  public override fun dispatchAllEvents() {
    scheduleDispatchOfBatchedEvents()
  }

  private fun scheduleDispatchOfBatchedEvents() {
    if (ReactNativeFeatureFlags.useOptimizedEventBatchingOnAndroid()) {
      if (!isDispatchScheduled) {
        isDispatchScheduled = true
        uiThreadHandler.postAtFrontOfQueue(dispatchEventsRunnable)
      }
    } else {
      currentFrameCallback.maybeScheduleDispatchOfBatchedEvents()
    }
  }

  /** Add a listener to this EventDispatcher. */
  public override fun addListener(listener: EventDispatcherListener) {
    listeners.add(listener)
  }

  /** Remove a listener from this EventDispatcher. */
  public override fun removeListener(listener: EventDispatcherListener) {
    listeners.remove(listener)
  }

  public override fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.add(listener)
  }

  public override fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.remove(listener)
  }

  public override fun onHostResume() {
    scheduleDispatchOfBatchedEvents()
    if (!ReactNativeFeatureFlags.useOptimizedEventBatchingOnAndroid()) {
      currentFrameCallback.resume()
    }
  }

  public override fun onHostPause() {
    cancelDispatchOfBatchedEvents()
  }

  public override fun onHostDestroy() {
    cancelDispatchOfBatchedEvents()
  }

  public override fun onCatalystInstanceDestroyed() {
    UiThreadUtil.runOnUiThread(Runnable { cancelDispatchOfBatchedEvents() })
  }

  private fun cancelDispatchOfBatchedEvents() {
    UiThreadUtil.assertOnUiThread()
    if (ReactNativeFeatureFlags.useOptimizedEventBatchingOnAndroid()) {
      isDispatchScheduled = false
      uiThreadHandler.removeCallbacks(dispatchEventsRunnable)
    } else {
      currentFrameCallback.stop()
    }
  }

  @Deprecated("Use the modern version with RCTModernEventEmitter")
  @Suppress("DEPRECATION")
  public override fun registerEventEmitter(
      @UIManagerType uiManagerType: Int,
      eventEmitter: RCTEventEmitter
  ) {
    reactEventEmitter.register(uiManagerType, eventEmitter)
  }

  public override fun registerEventEmitter(
      @UIManagerType uiManagerType: Int,
      eventEmitter: RCTModernEventEmitter
  ) {
    reactEventEmitter.register(uiManagerType, eventEmitter)
  }

  public override fun unregisterEventEmitter(@UIManagerType uiManagerType: Int) {
    reactEventEmitter.unregister(uiManagerType)
  }

  private inner class ScheduleDispatchFrameCallback : Choreographer.FrameCallback {
    @Volatile private var isFrameCallbackDispatchScheduled = false
    private var shouldStop = false

    override fun doFrame(frameTimeNanos: Long) {
      UiThreadUtil.assertOnUiThread()

      if (shouldStop) {
        isFrameCallbackDispatchScheduled = false
      } else {
        dispatchBatchedEvents()
      }

      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "BatchEventDispatchedListeners")
      try {
        for (listener in postEventDispatchListeners) {
          listener.onBatchEventDispatched()
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
      }
    }

    public fun stop() {
      shouldStop = true
    }

    public fun resume() {
      shouldStop = false
    }

    public fun maybeDispatchBatchedEvents() {
      if (!isFrameCallbackDispatchScheduled) {
        isFrameCallbackDispatchScheduled = true
        dispatchBatchedEvents()
      }
    }

    private fun dispatchBatchedEvents() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, currentFrameCallback)
    }

    public fun maybeScheduleDispatchOfBatchedEvents() {
      if (isFrameCallbackDispatchScheduled) {
        return
      }

      // We should only hit this slow path when we receive events while the host activity is paused.
      if (reactContext.isOnUiQueueThread()) {
        maybeDispatchBatchedEvents()
      } else {
        reactContext.runOnUiQueueThread(Runnable { maybeDispatchBatchedEvents() })
      }
    }
  }

  private companion object {
    private val uiThreadHandler: Handler = UiThreadUtil.getUiThreadHandler()
  }
}
