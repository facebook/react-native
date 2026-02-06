/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.util.LongSparseArray
import android.view.Choreographer
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil.assertOnUiThread
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.systrace.Systrace
import java.util.Arrays
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicInteger

/**
 * Class responsible for dispatching UI events to JS. The main purpose of this class is to act as an
 * intermediary between UI code generating events and JS, making sure we don't send more events than
 * JS can process.
 *
 * To use it, create a subclass of [Event] and call [dispatchEvent] whenever there's a UI event to
 * dispatch.
 *
 * This class works by installing a [Choreographer] frame callback on the main thread. This callback
 * then enqueues a runnable on the JS thread (if one is not already pending) that is responsible for
 * actually dispatch events to JS. This implementation depends on the properties that
 * 1) FrameCallbacks run after UI events have been processed in [Choreographer]
 * 2) when we enqueue a runnable on the JS queue thread, it won't be called until after any
 *    previously enqueued JS jobs have finished processing
 *
 * If JS is taking a long time processing events, then the UI events generated on the UI thread can
 * be coalesced into fewer events so that when the runnable runs, we don't overload JS with a ton of
 * events and make it get even farther behind.
 *
 * Ideally, we don't need this and JS is fast enough to process all the events each frame, but bad
 * things happen, including load on CPUs from the system, and we should handle this case well.
 *
 * # Event Cookies
 *
 * An event cookie is made up of the event type id, view tag, and a custom coalescing key. Only
 * Events that have the same cookie can be coalesced.
 *
 * Event Cookie Composition: VIEW_TAG_MASK = 0x00000000ffffffff EVENT_TYPE_ID_MASK =
 * 0x0000ffff00000000 COALESCING_KEY_MASK = 0xffff000000000000
 */
@InteropLegacyArchitecture
internal class EventDispatcherImpl(private val reactContext: ReactApplicationContext) :
    EventDispatcher, LifecycleEventListener {
  private val eventsStagingLock = Any()
  private val eventsToDispatchLock = Any()
  private val eventCookieToLastEventIdx = LongSparseArray<Int>()
  private val eventNameToEventId: MutableMap<String, Short> = mutableMapOf()
  private val dispatchEventsRunnable: DispatchEventsRunnable = DispatchEventsRunnable()
  private val eventStaging = ArrayList<Event<*>>()
  private val listeners = CopyOnWriteArrayList<EventDispatcherListener>()
  private val postEventDispatchListeners = CopyOnWriteArrayList<BatchEventDispatchedListener>()
  private val currentFrameCallback: ScheduleDispatchFrameCallback = ScheduleDispatchFrameCallback()
  private val hasDispatchScheduledCount = AtomicInteger()
  private var eventsToDispatch: Array<Event<*>?> = arrayOfNulls(16)
  private var eventsToDispatchSize = 0
  private val reactEventEmitter: EventEmitterImpl
  private var nextEventTypeId: Short = 0
  @Volatile private var hasDispatchScheduled = false

  init {
    reactContext.addLifecycleEventListener(this)
    reactEventEmitter = EventEmitterImpl(reactContext)
  }

  /** Sends the given Event to JS, coalescing eligible events if JS is backed up. */
  override fun dispatchEvent(event: Event<*>) {
    require(event.isInitialized) { "Dispatched event hasn't been initialized" }

    for (listener in listeners) {
      listener.onEventDispatch(event)
    }

    synchronized(eventsStagingLock) {
      eventStaging.add(event)
      Systrace.startAsyncFlow(Systrace.TRACE_TAG_REACT, event.getEventName(), event.uniqueID)
    }
    maybePostFrameCallbackFromNonUI()
  }

  override fun dispatchAllEvents() {
    maybePostFrameCallbackFromNonUI()
  }

  private fun maybePostFrameCallbackFromNonUI() {
    currentFrameCallback.maybePostFromNonUI()
  }

  /** Add a listener to this EventDispatcher. */
  override fun addListener(listener: EventDispatcherListener) {
    listeners.add(listener)
  }

  /** Remove a listener from this EventDispatcher. */
  override fun removeListener(listener: EventDispatcherListener) {
    listeners.remove(listener)
  }

  override fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.add(listener)
  }

  override fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.remove(listener)
  }

  override fun onHostResume() {
    maybePostFrameCallbackFromNonUI()
  }

  override fun onHostPause() {
    stopFrameCallback()
  }

  override fun onHostDestroy() {
    stopFrameCallback()
  }

  @Deprecated("Private API, should only be used when the concrete implementation is known.")
  override fun onCatalystInstanceDestroyed() {
    runOnUiThread { this.stopFrameCallback() }
  }

  private fun stopFrameCallback() {
    assertOnUiThread()
    currentFrameCallback.stop()
  }

  /**
   * We use a staging data structure so that all UI events generated in a single frame are
   * dispatched at once. Otherwise, a JS runnable enqueued in a previous frame could run while the
   * UI thread is in the process of adding UI events and we might incorrectly send one event this
   * frame and another from this frame during the next.
   */
  private fun moveStagedEventsToDispatchQueue() {
    synchronized(eventsStagingLock) {
      synchronized(eventsToDispatchLock) {
        for (i in eventStaging.indices) {
          val event: Event<*> = eventStaging[i]

          if (!event.canCoalesce()) {
            addEventToEventsToDispatch(event)
            continue
          }

          val eventCookie =
              getEventCookie(event.viewTag, event.getEventName(), event.getCoalescingKey())

          var eventToAdd: Event<*>? = null
          var eventToDispose: Event<*>? = null
          val lastEventIdx = eventCookieToLastEventIdx[eventCookie]

          if (lastEventIdx == null) {
            eventToAdd = event
            eventCookieToLastEventIdx.put(eventCookie, eventsToDispatchSize)
          } else {
            val lastEvent: Event<*> = checkNotNull(eventsToDispatch[lastEventIdx])
            val coalescedEvent = event.coalesce(lastEvent)
            if (coalescedEvent !== lastEvent) {
              eventToAdd = coalescedEvent
              eventCookieToLastEventIdx.put(eventCookie, eventsToDispatchSize)
              eventToDispose = lastEvent
              eventsToDispatch[lastEventIdx] = null
            } else {
              eventToDispose = event
            }
          }

          if (eventToAdd != null) {
            addEventToEventsToDispatch(eventToAdd)
          }
          eventToDispose?.dispose()
        }
      }
      eventStaging.clear()
    }
  }

  private fun getEventCookie(viewTag: Int, eventName: String, coalescingKey: Short): Long {
    val eventTypeId: Short
    val eventIdObj = eventNameToEventId[eventName]
    if (eventIdObj != null) {
      eventTypeId = eventIdObj
    } else {
      eventTypeId = nextEventTypeId++
      eventNameToEventId[eventName] = eventTypeId
    }
    return getEventCookie(viewTag, eventTypeId, coalescingKey)
  }

  private inner class ScheduleDispatchFrameCallback : Choreographer.FrameCallback {
    @Volatile private var isPosted = false
    private var shouldStop = false

    override fun doFrame(frameTimeNanos: Long) {
      assertOnUiThread()

      if (shouldStop) {
        isPosted = false
      } else {
        post()
      }

      Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ScheduleDispatchFrameCallback")
      try {
        moveStagedEventsToDispatchQueue()

        if (!hasDispatchScheduled) {
          hasDispatchScheduled = true
          Systrace.startAsyncFlow(
              Systrace.TRACE_TAG_REACT,
              "ScheduleDispatchFrameCallback",
              hasDispatchScheduledCount.get(),
          )
          reactContext.runOnJSQueueThread(dispatchEventsRunnable)
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
      }
    }

    fun stop() {
      shouldStop = true
    }

    fun maybePost() {
      if (!isPosted) {
        isPosted = true
        post()
      }
    }

    fun post() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, currentFrameCallback)
    }

    fun maybePostFromNonUI() {
      if (isPosted) {
        return
      }

      // We should only hit this slow path when we receive events while the host activity is paused.
      if (reactContext.isOnUiQueueThread) {
        maybePost()
      } else {
        reactContext.runOnUiQueueThread { maybePost() }
      }
    }
  }

  private inner class DispatchEventsRunnable : Runnable {
    override fun run() {
      Systrace.beginSection(Systrace.TRACE_TAG_REACT, "DispatchEventsRunnable")
      try {
        Systrace.endAsyncFlow(
            Systrace.TRACE_TAG_REACT,
            "ScheduleDispatchFrameCallback",
            hasDispatchScheduledCount.getAndIncrement(),
        )
        hasDispatchScheduled = false
        synchronized(eventsToDispatchLock) {
          if (eventsToDispatchSize > 0) {
            // We avoid allocating an array and iterator, and "sorting" if we don't need to.
            // This occurs when the size of mEventsToDispatch is zero or one.
            if (eventsToDispatchSize > 1) {
              Arrays.sort(eventsToDispatch, 0, eventsToDispatchSize, EVENT_COMPARATOR)
            }
            for (eventIdx in 0..<eventsToDispatchSize) {
              val event = eventsToDispatch[eventIdx] ?: continue
              // Event can be null if it has been coalesced into another event.
              Systrace.endAsyncFlow(Systrace.TRACE_TAG_REACT, event.getEventName(), event.uniqueID)

              event.dispatchModern(reactEventEmitter)
              event.dispose()
            }
            clearEventsToDispatch()
            eventCookieToLastEventIdx.clear()
          }
        }
        for (listener in postEventDispatchListeners) {
          listener.onBatchEventDispatched()
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
      }
    }
  }

  private fun addEventToEventsToDispatch(event: Event<*>) {
    if (eventsToDispatchSize == eventsToDispatch.size) {
      eventsToDispatch = eventsToDispatch.copyOf(2 * eventsToDispatch.size)
    }
    eventsToDispatch[eventsToDispatchSize++] = event
  }

  private fun clearEventsToDispatch() {
    Arrays.fill(eventsToDispatch, 0, eventsToDispatchSize, null)
    eventsToDispatchSize = 0
  }

  companion object {
    private val EVENT_COMPARATOR: java.util.Comparator<Event<*>?> =
        java.util.Comparator { lhs, rhs ->
          when {
            lhs == null && rhs == null -> 0
            lhs == null -> -1
            rhs == null -> 1
            else -> {
              val diff = lhs.timestampMs - rhs.timestampMs
              when {
                diff == 0L -> 0
                diff < 0 -> -1
                else -> 1
              }
            }
          }
        }

    private fun getEventCookie(viewTag: Int, eventTypeId: Short, coalescingKey: Short): Long =
        (viewTag.toLong() or
            (((eventTypeId.toLong()) and 0xffffL) shl 32) or
            (((coalescingKey.toLong()) and 0xffffL) shl 48))
  }
}
