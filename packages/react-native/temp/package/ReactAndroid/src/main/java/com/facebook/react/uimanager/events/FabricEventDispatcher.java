/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.os.Handler;
import android.view.Choreographer;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.systrace.Systrace;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * A singleton class that overrides {@link EventDispatcher} with no-op methods, to be used by
 * callers that expect an EventDispatcher when the instance doesn't exist.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class FabricEventDispatcher implements EventDispatcher, LifecycleEventListener {
  private static final Handler uiThreadHandler = UiThreadUtil.getUiThreadHandler();

  private final ReactEventEmitter mReactEventEmitter;
  private final ReactApplicationContext mReactContext;
  private final CopyOnWriteArrayList<EventDispatcherListener> mListeners =
      new CopyOnWriteArrayList<>();
  private final CopyOnWriteArrayList<BatchEventDispatchedListener> mPostEventDispatchListeners =
      new CopyOnWriteArrayList<>();
  private final FabricEventDispatcher.ScheduleDispatchFrameCallback mCurrentFrameCallback =
      new FabricEventDispatcher.ScheduleDispatchFrameCallback();

  private boolean mIsDispatchScheduled = false;
  private final Runnable mDispatchEventsRunnable =
      new Runnable() {
        @Override
        public void run() {
          mIsDispatchScheduled = false;

          Systrace.beginSection(
              Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "BatchEventDispatchedListeners");
          try {
            for (BatchEventDispatchedListener listener : mPostEventDispatchListeners) {
              listener.onBatchEventDispatched();
            }
          } finally {
            Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
          }
        }
      };

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
    if (event.experimental_isSynchronous()) {
      dispatchSynchronous(event);
    } else {
      event.dispatchModern(mReactEventEmitter);
    }

    event.dispose();
    scheduleDispatchOfBatchedEvents();
  }

  private void dispatchSynchronous(Event event) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricEventDispatcher.dispatchSynchronous('" + event.getEventName() + "')");
    try {
      UIManager fabricUIManager = UIManagerHelper.getUIManager(mReactContext, UIManagerType.FABRIC);
      if (fabricUIManager instanceof SynchronousEventReceiver) {
        ((SynchronousEventReceiver) fabricUIManager)
            .receiveEvent(
                event.getSurfaceId(),
                event.getViewTag(),
                event.getEventName(),
                event.canCoalesce(),
                event.getEventData(),
                event.getEventCategory(),
                true);
      } else {
        ReactSoftExceptionLogger.logSoftException(
            "FabricEventDispatcher",
            new ReactNoCrashSoftException(
                "Fabric UIManager expected to implement SynchronousEventReceiver."));
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  public void dispatchAllEvents() {
    scheduleDispatchOfBatchedEvents();
  }

  private void scheduleDispatchOfBatchedEvents() {
    if (ReactNativeFeatureFlags.useOptimizedEventBatchingOnAndroid()) {
      if (!mIsDispatchScheduled) {
        mIsDispatchScheduled = true;
        uiThreadHandler.postAtFrontOfQueue(mDispatchEventsRunnable);
      }
    } else {
      mCurrentFrameCallback.maybeScheduleDispatchOfBatchedEvents();
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
    scheduleDispatchOfBatchedEvents();
  }

  @Override
  public void onHostPause() {
    cancelDispatchOfBatchedEvents();
  }

  @Override
  public void onHostDestroy() {
    cancelDispatchOfBatchedEvents();
  }

  public void onCatalystInstanceDestroyed() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            cancelDispatchOfBatchedEvents();
          }
        });
  }

  private void cancelDispatchOfBatchedEvents() {
    UiThreadUtil.assertOnUiThread();
    if (ReactNativeFeatureFlags.useOptimizedEventBatchingOnAndroid()) {
      mIsDispatchScheduled = false;
      uiThreadHandler.removeCallbacks(mDispatchEventsRunnable);
    } else {
      mCurrentFrameCallback.stop();
    }
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
    private volatile boolean mIsDispatchScheduled = false;
    private boolean mShouldStop = false;

    @Override
    public void doFrame(long frameTimeNanos) {
      UiThreadUtil.assertOnUiThread();

      if (mShouldStop) {
        mIsDispatchScheduled = false;
      } else {
        dispatchBatchedEvents();
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

    public void maybeDispatchBatchedEvents() {
      if (!mIsDispatchScheduled) {
        mIsDispatchScheduled = true;
        dispatchBatchedEvents();
      }
    }

    private void dispatchBatchedEvents() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, mCurrentFrameCallback);
    }

    public void maybeScheduleDispatchOfBatchedEvents() {
      if (mIsDispatchScheduled) {
        return;
      }

      // We should only hit this slow path when we receive events while the host activity is paused.
      if (mReactContext.isOnUiQueueThread()) {
        maybeDispatchBatchedEvents();
      } else {
        mReactContext.runOnUiQueueThread(
            new Runnable() {
              @Override
              public void run() {
                maybeDispatchBatchedEvents();
              }
            });
      }
    }
  }
}
