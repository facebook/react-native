/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.common.UIManagerType;

/**
 * A UI event that can be dispatched to JS.
 *
 * <p>For dispatching events {@code getEventData} should be used. Once event object is passed to the
 * EventDispatched it should no longer be used as EventDispatcher may decide to recycle that object
 * (by calling {@link #dispose}).
 *
 * <p>If you need advanced customizations and overriding only {@code getEventData} doesn't work for
 * you, you must override both {@code dispatch} and {@code dispatchModern}. Both of these will be
 * deleted in the distant future and it is highly recommended to use only {@code getEventData}.
 *
 * <p>Old, pre-Fabric Events only used viewTag as the identifier, but Fabric needs surfaceId as well
 * as viewTag. You may use {@code UIManagerHelper.getSurfaceId} on a Fabric-managed View to get the
 * surfaceId. Fabric will work without surfaceId - making {@code Event} backwards-compatible - but
 * Events without SurfaceId are slightly slower to propagate.
 */
public abstract class Event<T extends Event> {

  private static int sUniqueID = 0;

  private boolean mInitialized;
  private @UIManagerType int mUIManagerType;
  private int mSurfaceId;
  private int mViewTag;
  private long mTimestampMs;
  private int mUniqueID = sUniqueID++;

  protected Event() {}

  @Deprecated
  protected Event(int viewTag) {
    init(viewTag);
  }

  protected Event(int surfaceId, int viewTag) {
    init(surfaceId, viewTag);
  }

  @Deprecated
  protected void init(int viewTag) {
    init(-1, viewTag);
  }

  protected void init(int surfaceId, int viewTag) {
    init(surfaceId, viewTag, SystemClock.uptimeMillis());
  }

  /**
   * This method needs to be called before event is sent to event dispatcher. Event timestamps can
   * optionally be dated/backdated to a custom time: for example, touch events should be dated with
   * the system event time.
   */
  protected void init(int surfaceId, int viewTag, long timestampMs) {
    mSurfaceId = surfaceId;
    mViewTag = viewTag;

    // We infer UIManagerType. Even though it's not passed in explicitly, we have a
    // contract that Fabric events *always* have a SurfaceId passed in, and non-Fabric events
    // NEVER have a SurfaceId passed in (the default/placeholder of -1 is passed in instead).
    // Why does this matter?
    // Events can be sent to Views that are part of the View hierarchy *but not directly managed
    // by React Native*. For example, embedded custom hierachies, Litho hierachies, etc.
    // In those cases it's important to konw that the Event should be sent to the Fabric or
    // non-Fabric UIManager, and we cannot use the ViewTag for inference since it's not controlled
    // by RN and is essentially a random number.
    // At some point it would be great to pass the SurfaceContext here instead.
    mUIManagerType = (surfaceId == -1 ? UIManagerType.DEFAULT : UIManagerType.FABRIC);

    mTimestampMs = timestampMs;
    mInitialized = true;
  }

  /** @return the view id for the view that generated this event */
  public final int getViewTag() {
    return mViewTag;
  }

  /** @return the surfaceId for the view that generated this event */
  public final int getSurfaceId() {
    return mSurfaceId;
  }

  /**
   * @return the time at which the event happened in the {@link android.os.SystemClock#uptimeMillis}
   *     base.
   */
  public final long getTimestampMs() {
    return mTimestampMs;
  }

  /** @return false if this Event can *never* be coalesced */
  public boolean canCoalesce() {
    return true;
  }

  /**
   * Given two events, coalesce them into a single event that will be sent to JS instead of two
   * separate events. By default, just chooses the one the is more recent, or {@code this} if
   * timestamps are the same.
   *
   * <p>Two events will only ever try to be coalesced if they have the same event name, view id, and
   * coalescing key.
   */
  public T coalesce(T otherEvent) {
    return (T) (getTimestampMs() >= otherEvent.getTimestampMs() ? this : otherEvent);
  }

  /**
   * @return a key used to determine which other events of this type this event can be coalesced
   *     with. For example, touch move events should only be coalesced within a single gesture so a
   *     coalescing key there would be the unique gesture id.
   */
  public short getCoalescingKey() {
    return 0;
  }

  /** @return The unique id of this event. */
  public int getUniqueID() {
    return mUniqueID;
  }

  /**
   * Called when the EventDispatcher is done with an event, either because it was dispatched or
   * because it was coalesced with another Event.
   */
  public void onDispose() {}

  /*package*/ boolean isInitialized() {
    return mInitialized;
  }

  /*package*/ final void dispose() {
    mInitialized = false;
    onDispose();
  }

  public final @UIManagerType int getUIManagerType() {
    return mUIManagerType;
  }

  /** @return the name of this event as registered in JS */
  public abstract String getEventName();

  /**
   * Dispatch this event to JS using the given event emitter. Compatible with old and new renderer.
   * Instead of using this or dispatchModern, it is recommended that you simply override
   * `getEventData`.
   */
  @Deprecated
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = getEventData();
    if (eventData == null) {
      throw new IllegalViewOperationException(
          "Event: you must return a valid, non-null value from `getEventData`, or override `dispatch` and `dispatchModern`. Event: "
              + getEventName());
    }
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }

  /**
   * Can be overridden by classes to make migrating to RCTModernEventEmitter support easier. If this
   * class returns null, the RCTEventEmitter interface will be used instead of
   * RCTModernEventEmitter. In the future, returning null here will be an error.
   */
  @Nullable
  protected WritableMap getEventData() {
    return null;
  }

  @EventCategoryDef
  protected int getEventCategory() {
    return EventCategoryDef.UNSPECIFIED;
  }

  /**
   * Dispatch this event to JS using a V2 EventEmitter. If surfaceId is not -1 and `getEventData` is
   * non-null, this will use the RCTModernEventEmitter API. Otherwise, it falls back to the
   * old-style dispatch function. For Event classes that need to do something different, this method
   * can always be overridden entirely, but it is not recommended.
   *
   * <p>This method additionally allows C++ to coalesce events and detect continuous ones for
   * concurrent mode (Fabric only).
   *
   * @see #dispatch
   */
  @Deprecated
  public void dispatchModern(RCTModernEventEmitter rctEventEmitter) {
    if (getSurfaceId() != -1) {
      WritableMap eventData = getEventData();
      if (eventData != null) {
        rctEventEmitter.receiveEvent(
            getSurfaceId(),
            getViewTag(),
            getEventName(),
            canCoalesce(),
            getCoalescingKey(),
            eventData,
            getEventCategory());
        return;
      }
    }
    dispatch(rctEventEmitter);
  }
}
