/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.util.LongSparseArray;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Class responsible for dispatching UI events to JS. The main purpose of this class is to act as an
 * intermediary between UI code generating events and JS, making sure we don't send more events than
 * JS can process.
 *
 * <p>To use it, create a subclass of {@link Event} and call {@link #dispatchEvent(Event)} whenever
 * there's a UI event to dispatch.
 *
 * <p>This class works by installing a Choreographer frame callback on the main thread. This
 * callback then enqueues a runnable on the JS thread (if one is not already pending) that is
 * responsible for actually dispatch events to JS. This implementation depends on the properties
 * that 1) FrameCallbacks run after UI events have been processed in Choreographer.java 2) when we
 * enqueue a runnable on the JS queue thread, it won't be called until after any previously enqueued
 * JS jobs have finished processing
 *
 * <p>If JS is taking a long time processing events, then the UI events generated on the UI thread
 * can be coalesced into fewer events so that when the runnable runs, we don't overload JS with a
 * ton of events and make it get even farther behind.
 *
 * <p>Ideally, we don't need this and JS is fast enough to process all the events each frame, but
 * bad things happen, including load on CPUs from the system, and we should handle this case well.
 *
 * <p>== Event Cookies ==
 *
 * <p>An event cookie is made up of the event type id, view tag, and a custom coalescing key. Only
 * Events that have the same cookie can be coalesced.
 *
 * <p>Event Cookie Composition: VIEW_TAG_MASK = 0x00000000ffffffff EVENT_TYPE_ID_MASK =
 * 0x0000ffff00000000 COALESCING_KEY_MASK = 0xffff000000000000
 */
public class EventDispatcherImpl implements EventDispatcher, LifecycleEventListener {

  private static final Comparator<Event> EVENT_COMPARATOR =
      new Comparator<Event>() {
        @Override
        public int compare(Event lhs, Event rhs) {
          if (lhs == null && rhs == null) {
            return 0;
          }
          if (lhs == null) {
            return -1;
          }
          if (rhs == null) {
            return 1;
          }

          long diff = lhs.getTimestampMs() - rhs.getTimestampMs();
          if (diff == 0) {
            return 0;
          } else if (diff < 0) {
            return -1;
          } else {
            return 1;
          }
        }
      };

  private final Object mEventsStagingLock = new Object();
  private final Object mEventsToDispatchLock = new Object();
  private final ReactApplicationContext mReactContext;
  private final LongSparseArray<Integer> mEventCookieToLastEventIdx = new LongSparseArray<>();
  private final Map<String, Short> mEventNameToEventId = MapBuilder.newHashMap();
  private final DispatchEventsRunnable mDispatchEventsRunnable = new DispatchEventsRunnable();
  private final ArrayList<Event> mEventStaging = new ArrayList<>();
  private final CopyOnWriteArrayList<EventDispatcherListener> mListeners =
      new CopyOnWriteArrayList<>();
  private final CopyOnWriteArrayList<BatchEventDispatchedListener> mPostEventDispatchListeners =
      new CopyOnWriteArrayList<>();
  private final ScheduleDispatchFrameCallback mCurrentFrameCallback =
      new ScheduleDispatchFrameCallback();
  private final AtomicInteger mHasDispatchScheduledCount = new AtomicInteger();

  private Event[] mEventsToDispatch = new Event[16];
  private int mEventsToDispatchSize = 0;
  private volatile ReactEventEmitter mReactEventEmitter;
  private short mNextEventTypeId = 0;
  private volatile boolean mHasDispatchScheduled = false;

  public EventDispatcherImpl(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
    mReactContext.addLifecycleEventListener(this);
    mReactEventEmitter = new ReactEventEmitter(mReactContext);
  }

  /** Sends the given Event to JS, coalescing eligible events if JS is backed up. */
  public void dispatchEvent(Event event) {
    Assertions.assertCondition(event.isInitialized(), "Dispatched event hasn't been initialized");

    for (EventDispatcherListener listener : mListeners) {
      listener.onEventDispatch(event);
    }

    synchronized (mEventsStagingLock) {
      mEventStaging.add(event);
      Systrace.startAsyncFlow(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, event.getEventName(), event.getUniqueID());
    }
    maybePostFrameCallbackFromNonUI();
  }

  public void dispatchAllEvents() {
    maybePostFrameCallbackFromNonUI();
  }

  private void maybePostFrameCallbackFromNonUI() {
    if (mReactEventEmitter != null) {
      // If the host activity is paused, the frame callback may not be currently
      // posted. Ensure that it is so that this event gets delivered promptly.
      mCurrentFrameCallback.maybePostFromNonUI();
    } else {
      // No JS application has started yet, or resumed. This can happen when a ReactRootView is
      // added to view hierarchy, but ReactContext creation has not completed yet. In this case, any
      // touch event dispatch will hit this codepath, and we simply queue them so that they
      // are dispatched once ReactContext creation completes and JS app is running.
    }
  }

  /** Add a listener to this EventDispatcher. */
  public void addListener(EventDispatcherListener listener) {
    mListeners.add(listener);
  }

  /** Remove a listener from this EventDispatcher. */
  public void removeListener(EventDispatcherListener listener) {
    mListeners.remove(listener);
  }

  public void addBatchEventDispatchedListener(BatchEventDispatchedListener listener) {
    mPostEventDispatchListeners.add(listener);
  }

  public void removeBatchEventDispatchedListener(BatchEventDispatchedListener listener) {
    mPostEventDispatchListeners.remove(listener);
  }

  @Override
  public void onHostResume() {
    maybePostFrameCallbackFromNonUI();
  }

  @Override
  public void onHostPause() {
    stopFrameCallback();
  }

  @Override
  public void onHostDestroy() {
    stopFrameCallback();
  }

  public void onCatalystInstanceDestroyed() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            stopFrameCallback();
          }
        });
  }

  private void stopFrameCallback() {
    UiThreadUtil.assertOnUiThread();
    mCurrentFrameCallback.stop();
  }

  /**
   * We use a staging data structure so that all UI events generated in a single frame are
   * dispatched at once. Otherwise, a JS runnable enqueued in a previous frame could run while the
   * UI thread is in the process of adding UI events and we might incorrectly send one event this
   * frame and another from this frame during the next.
   */
  private void moveStagedEventsToDispatchQueue() {
    synchronized (mEventsStagingLock) {
      synchronized (mEventsToDispatchLock) {
        for (int i = 0; i < mEventStaging.size(); i++) {
          Event event = mEventStaging.get(i);

          if (!event.canCoalesce()) {
            addEventToEventsToDispatch(event);
            continue;
          }

          long eventCookie =
              getEventCookie(event.getViewTag(), event.getEventName(), event.getCoalescingKey());

          Event eventToAdd = null;
          Event eventToDispose = null;
          Integer lastEventIdx = mEventCookieToLastEventIdx.get(eventCookie);

          if (lastEventIdx == null) {
            eventToAdd = event;
            mEventCookieToLastEventIdx.put(eventCookie, mEventsToDispatchSize);
          } else {
            Event lastEvent = mEventsToDispatch[lastEventIdx];
            Event coalescedEvent = event.coalesce(lastEvent);
            if (coalescedEvent != lastEvent) {
              eventToAdd = coalescedEvent;
              mEventCookieToLastEventIdx.put(eventCookie, mEventsToDispatchSize);
              eventToDispose = lastEvent;
              mEventsToDispatch[lastEventIdx] = null;
            } else {
              eventToDispose = event;
            }
          }

          if (eventToAdd != null) {
            addEventToEventsToDispatch(eventToAdd);
          }
          if (eventToDispose != null) {
            eventToDispose.dispose();
          }
        }
      }
      mEventStaging.clear();
    }
  }

  private long getEventCookie(int viewTag, String eventName, short coalescingKey) {
    short eventTypeId;
    Short eventIdObj = mEventNameToEventId.get(eventName);
    if (eventIdObj != null) {
      eventTypeId = eventIdObj;
    } else {
      eventTypeId = mNextEventTypeId++;
      mEventNameToEventId.put(eventName, eventTypeId);
    }
    return getEventCookie(viewTag, eventTypeId, coalescingKey);
  }

  private static long getEventCookie(int viewTag, short eventTypeId, short coalescingKey) {
    return viewTag
        | (((long) eventTypeId) & 0xffff) << 32
        | (((long) coalescingKey) & 0xffff) << 48;
  }

  public void registerEventEmitter(@UIManagerType int uiManagerType, RCTEventEmitter eventEmitter) {
    mReactEventEmitter.register(uiManagerType, eventEmitter);
  }

  public void registerEventEmitter(
      @UIManagerType int uiManagerType, RCTModernEventEmitter eventEmitter) {
    mReactEventEmitter.register(uiManagerType, eventEmitter);
  }

  public void unregisterEventEmitter(@UIManagerType int uiManagerType) {
    mReactEventEmitter.unregister(uiManagerType);
  }

  private class ScheduleDispatchFrameCallback extends ChoreographerCompat.FrameCallback {
    private volatile boolean mIsPosted = false;
    private boolean mShouldStop = false;

    @Override
    public void doFrame(long frameTimeNanos) {
      UiThreadUtil.assertOnUiThread();

      if (mShouldStop) {
        mIsPosted = false;
      } else {
        post();
      }

      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ScheduleDispatchFrameCallback");
      try {
        moveStagedEventsToDispatchQueue();

        if (!mHasDispatchScheduled) {
          mHasDispatchScheduled = true;
          Systrace.startAsyncFlow(
              Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
              "ScheduleDispatchFrameCallback",
              mHasDispatchScheduledCount.get());
          mReactContext.runOnJSQueueThread(mDispatchEventsRunnable);
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    public void stop() {
      mShouldStop = true;
    }

    public void maybePost() {
      if (!mIsPosted) {
        mIsPosted = true;
        post();
      }
    }

    private void post() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, mCurrentFrameCallback);
    }

    public void maybePostFromNonUI() {
      if (mIsPosted) {
        return;
      }

      // We should only hit this slow path when we receive events while the host activity is paused.
      if (mReactContext.isOnUiQueueThread()) {
        maybePost();
      } else {
        mReactContext.runOnUiQueueThread(
            new Runnable() {
              @Override
              public void run() {
                maybePost();
              }
            });
      }
    }
  }

  private class DispatchEventsRunnable implements Runnable {

    @Override
    public void run() {
      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "DispatchEventsRunnable");
      try {
        Systrace.endAsyncFlow(
            Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
            "ScheduleDispatchFrameCallback",
            mHasDispatchScheduledCount.getAndIncrement());
        mHasDispatchScheduled = false;
        Assertions.assertNotNull(mReactEventEmitter);
        synchronized (mEventsToDispatchLock) {
          if (mEventsToDispatchSize > 0) {
            // We avoid allocating an array and iterator, and "sorting" if we don't need to.
            // This occurs when the size of mEventsToDispatch is zero or one.
            if (mEventsToDispatchSize > 1) {
              Arrays.sort(mEventsToDispatch, 0, mEventsToDispatchSize, EVENT_COMPARATOR);
            }
            for (int eventIdx = 0; eventIdx < mEventsToDispatchSize; eventIdx++) {
              Event event = mEventsToDispatch[eventIdx];
              // Event can be null if it has been coalesced into another event.
              if (event == null) {
                continue;
              }
              Systrace.endAsyncFlow(
                  Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, event.getEventName(), event.getUniqueID());
              event.dispatchModern(mReactEventEmitter);
              event.dispose();
            }
            clearEventsToDispatch();
            mEventCookieToLastEventIdx.clear();
          }
        }
        for (BatchEventDispatchedListener listener : mPostEventDispatchListeners) {
          listener.onBatchEventDispatched();
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
  }

  private void addEventToEventsToDispatch(Event event) {
    if (mEventsToDispatchSize == mEventsToDispatch.length) {
      mEventsToDispatch = Arrays.copyOf(mEventsToDispatch, 2 * mEventsToDispatch.length);
    }
    mEventsToDispatch[mEventsToDispatchSize++] = event;
  }

  private void clearEventsToDispatch() {
    Arrays.fill(mEventsToDispatch, 0, mEventsToDispatchSize, null);
    mEventsToDispatchSize = 0;
  }
}
