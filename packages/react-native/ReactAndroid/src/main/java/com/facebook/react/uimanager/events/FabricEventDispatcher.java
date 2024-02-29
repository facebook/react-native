/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.Choreographer;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.systrace.Systrace;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * A singleton class that overrides {@link EventDispatcher} with no-op methods, to be used by
 * callers that expect an EventDispatcher when the instance doesn't exist.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class FabricEventDispatcher implements EventDispatcher, LifecycleEventListener {
  private final ReactEventEmitter mReactEventEmitter;
  private final ReactApplicationContext mReactContext;
  private final CopyOnWriteArrayList<EventDispatcherListener> mListeners =
      new CopyOnWriteArrayList<>();
  private final CopyOnWriteArrayList<BatchEventDispatchedListener> mPostEventDispatchListeners =
      new CopyOnWriteArrayList<>();
  private final FabricEventDispatcher.ScheduleDispatchFrameCallback mCurrentFrameCallback =
      new FabricEventDispatcher.ScheduleDispatchFrameCallback();

  public FabricEventDispatcher(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
    mReactContext.addLifecycleEventListener(this);
    mReactEventEmitter = new ReactEventEmitter(mReactContext);
  }

  @Override
  public void dispatchEvent(Event event) {
    for (EventDispatcherListener listener : mListeners) {
      listener.onEventDispatch(event);
    }
    event.dispatchModern(mReactEventEmitter);

    event.dispose();
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

  private class ScheduleDispatchFrameCallback implements Choreographer.FrameCallback {
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

      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "BatchEventDispatchedListeners");
      try {
        for (BatchEventDispatchedListener listener : mPostEventDispatchListeners) {
          listener.onBatchEventDispatched();
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
}
