/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.SystemClock.uptimeMillis

/**
 * A UI event that can be dispatched to JS.
 *
 * For dispatching events `getEventData` should be used. Once event object is passed to the
 * EventDispatcher it should no longer be used as EventDispatcher may decide to recycle that object
 * (by calling [dispose]).
 *
 * If you need advanced customizations and overriding only `getEventData` doesn't work for you, you
 * must override both `dispatch` and `dispatchModern`. Both of these will be deleted in the distant
 * future and it is highly recommended to use only `getEventData`.
 *
 * Old, pre-Fabric Events only used viewTag as the identifier, but Fabric needs surfaceId as well as
 * viewTag. You may use [com.facebook.react.uimanager.UIManagerHelper.getSurfaceId] on a
 * Fabric-managed View to get the surfaceId. Fabric will work without surfaceId - making [Event]
 * backwards-compatible - but Events without SurfaceId are slightly slower to propagate.
 */
public abstract class Event<T : Event<T>> {
  public var isInitialized: Boolean = false
    private set

  /** @return the surfaceId for the view that generated this event */
  public var surfaceId: Int = 0
    private set

  /** @return the view id for the view that generated this event */
  public var viewTag: Int = 0
    private set

  /**
   * @return the time at which the event happened in the [android.os.SystemClock.uptimeMillis] base.
   */
  public var timestampMs: Long = 0
    private set

  /** @return The unique id of this event. */
  public val uniqueID: Int = uniqueIdCounter++
  private var eventAnimationDriverMatchSpecCached: EventAnimationDriverMatchSpec? = null

  protected constructor()

  @Deprecated(
      "Use constructor with explicit surfaceId instead", ReplaceWith("Event(surfaceId, viewTag)"))
  protected constructor(viewTag: Int) {
    init(viewTag)
  }

  protected constructor(surfaceId: Int, viewTag: Int) {
    init(surfaceId, viewTag)
  }

  @Deprecated(
      "Use version with explicit surfaceId instead", ReplaceWith("init(surfaceId, viewTag)"))
  protected fun init(viewTag: Int) {
    init(-1, viewTag)
  }

  /**
   * This method needs to be called before event is sent to event dispatcher. Event timestamps can
   * optionally be dated/backdated to a custom time: for example, touch events should be dated with
   * the system event time.
   */
  protected fun init(surfaceId: Int, viewTag: Int, timestampMs: Long) {
    this.surfaceId = surfaceId
    this.viewTag = viewTag
    this.timestampMs = timestampMs
    this.isInitialized = true
  }

  protected fun init(surfaceId: Int, viewTag: Int) {
    init(surfaceId, viewTag, uptimeMillis())
  }

  /** @return false if this Event can *never* be coalesced */
  public open fun canCoalesce(): Boolean = true

  /**
   * Given two events, coalesce them into a single event that will be sent to JS instead of two
   * separate events. By default, just chooses the one the is more recent, or `this` if timestamps
   * are the same.
   *
   * Two events will only ever try to be coalesced if they have the same event name, view id, and
   * coalescing key.
   */
  public open fun coalesce(otherEvent: Event<*>?): Event<*>? =
      if (timestampMs >= otherEvent?.timestampMs ?: 0) this else otherEvent

  /**
   * @return a key used to determine which other events of this type this event can be coalesced
   *   with. For example, touch move events should only be coalesced within a single gesture so a
   *   coalescing key there would be the unique gesture id.
   */
  public open fun getCoalescingKey(): Short = 0

  /**
   * Called when the EventDispatcher is done with an event, either because it was dispatched or
   * because it was coalesced with another Event.
   */
  public open fun onDispose(): Unit = Unit

  public fun dispose() {
    this.isInitialized = false
    onDispose()
  }

  /** @return the name of this event as registered in JS */
  public abstract fun getEventName(): String

  /** Property added for backward compatibility with property accessors */
  @get:JvmName("internal_getEventNameCompat")
  public val eventName: String
    get() = getEventName()

  public open val eventAnimationDriverMatchSpec: EventAnimationDriverMatchSpec?
    get() {
      if (eventAnimationDriverMatchSpecCached == null) {
        eventAnimationDriverMatchSpecCached =
            object : EventAnimationDriverMatchSpec {
              override fun match(viewTagRhs: Int, eventNameRhs: String): Boolean {
                return viewTag == viewTagRhs && eventName == eventNameRhs
              }
            }
      }
      return eventAnimationDriverMatchSpecCached
    }

  /**
   * Dispatch this event to JS using the given event emitter. Compatible with old and new renderer.
   * Instead of using this or dispatchModern, it is recommended that you simply override
   * `getEventData`.
   */
  @Deprecated("Prefer to override getEventData instead")
  public open fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, getEventData())
  }

  /** Can be overridden by classes when no custom logic for dispatching is needed. */
  protected open fun getEventData(): WritableMap? = null

  /**
   * NOTE: This is a transitional method that allows accessing event data from outside the
   * sublcasses, but inside the package.
   */
  internal fun internal_getEventData(): WritableMap? = getEventData()

  protected open fun getEventCategory(): Int = EventCategoryDef.UNSPECIFIED

  /**
   * NOTE: This is a transitional method that allows accessing event category from outside the
   * sublcasses, but inside the package.
   */
  internal fun internal_getEventCategory(): Int = getEventCategory()

  protected open fun experimental_isSynchronous(): Boolean = false

  /**
   * NOTE: This is a transitional method that allows accessing event category from outside the
   * sublcasses, but inside the package.
   */
  internal fun internal_experimental_isSynchronous(): Boolean = experimental_isSynchronous()

  /**
   * Dispatch this event to JS using a V2 EventEmitter. If surfaceId is not -1 and `getEventData` is
   * non-null, this will use the RCTModernEventEmitter API. Otherwise, it falls back to the
   * old-style dispatch function. For Event classes that need to do something different, this method
   * can always be overridden entirely, but it is not recommended.
   *
   * This method additionally allows C++ to coalesce events and detect continuous ones for
   * concurrent mode (Fabric only).
   *
   * @see .dispatch
   */
  public open fun dispatchModern(rctEventEmitter: RCTModernEventEmitter) {
    if (surfaceId != -1) {
      rctEventEmitter.receiveEvent(
          surfaceId,
          viewTag,
          eventName,
          canCoalesce(),
          getCoalescingKey().toInt(),
          getEventData(),
          getEventCategory())
    } else {
      dispatch(rctEventEmitter)
    }
  }

  public fun interface EventAnimationDriverMatchSpec {
    public fun match(viewTagRhs: Int, eventNameRhs: String): Boolean
  }

  private companion object {
    private var uniqueIdCounter = 0
  }
}
