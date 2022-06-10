/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.common.UIManagerType;
import java.util.concurrent.CopyOnWriteArrayList;

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
 *
 * <p>This is a copy of EventDispatcherImpl, meant only to remove locking and synchronization.
 */
public class LockFreeEventDispatcherImpl implements EventDispatcher, LifecycleEventListener {

  private final boolean DEBUG_MODE = ReactBuildConfig.DEBUG;
  private final String TAG = LockFreeEventDispatcherImpl.class.getSimpleName();

  private final ReactApplicationContext mReactContext;
  private final CopyOnWriteArrayList<EventDispatcherListener> mListeners =
      new CopyOnWriteArrayList<>();
  private final CopyOnWriteArrayList<BatchEventDispatchedListener> mPostEventDispatchListeners =
      new CopyOnWriteArrayList<>();
  private final LockFreeEventDispatcherImpl.ScheduleDispatchFrameCallback mCurrentFrameCallback =
      new LockFreeEventDispatcherImpl.ScheduleDispatchFrameCallback();

  private volatile ReactEventEmitter mReactEventEmitter;

  public LockFreeEventDispatcherImpl(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
    mReactContext.addLifecycleEventListener(this);
    mReactEventEmitter = new ReactEventEmitter(mReactContext);
  }

  /** Sends the given Event to C++, where it will be flushed to JS ASAP. */
  public void dispatchEvent(Event event) {
    Assertions.assertCondition(event.isInitialized(), "Dispatched event hasn't been initialized");
    Assertions.assertNotNull(mReactEventEmitter);

    if (DEBUG_MODE) {
      FLog.v(TAG, "dispatchEvent: " + event.toString());
    }

    for (EventDispatcherListener listener : mListeners) {
      listener.onEventDispatch(event);
    }

    event.dispatchModern(mReactEventEmitter);
    event.dispose();
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

      driveEventBeats();
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

  /**
   * Is this a misnomer? It's called "driveEventBeats" but then is just calls
   * `onBatchEventDispatched` listeners? Practically, all that `onBatchEventDispatched` is used for
   * in Fabric is to drive AsyncEventBeats.
   *
   * <p>If this class ships for Fabric, we should remove `driveEventBeats` from here entirely,
   * because it no longer needs to be connected to this event dispatcher. We should/probably can
   * also delete `onRequestEventBeat` entirely.
   */
  private void driveEventBeats() {
    for (BatchEventDispatchedListener listener : mPostEventDispatchListeners) {
      listener.onBatchEventDispatched();
    }
  }
}
