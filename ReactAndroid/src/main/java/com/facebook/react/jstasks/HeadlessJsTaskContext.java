/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks;

import android.os.Handler;
import android.util.SparseArray;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.appregistry.AppRegistry;
import java.lang.ref.WeakReference;
import java.util.Map;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Helper class for dealing with JS tasks. Handles per-ReactContext active task tracking, starting /
 * stopping tasks and notifying listeners.
 */
public class HeadlessJsTaskContext {

  private static final WeakHashMap<ReactContext, HeadlessJsTaskContext> INSTANCES =
      new WeakHashMap<>();

  /**
   * Get the task helper instance for a particular {@link ReactContext}. There is only one instance
   * per context.
   *
   * <p><strong>Note:</strong> do not hold long-lived references to the object returned here, as
   * that will cause memory leaks. Instead, just call this method on-demand.
   */
  public static HeadlessJsTaskContext getInstance(ReactContext context) {
    HeadlessJsTaskContext helper = INSTANCES.get(context);
    if (helper == null) {
      helper = new HeadlessJsTaskContext(context);
      INSTANCES.put(context, helper);
    }
    return helper;
  }

  private final WeakReference<ReactContext> mReactContext;
  private final Set<HeadlessJsTaskEventListener> mHeadlessJsTaskEventListeners =
      new CopyOnWriteArraySet<>();
  private final AtomicInteger mLastTaskId = new AtomicInteger(0);
  private final Handler mHandler = new Handler();
  private final Set<Integer> mActiveTasks = new CopyOnWriteArraySet<>();
  private final Map<Integer, HeadlessJsTaskConfig> mActiveTaskConfigs = new ConcurrentHashMap<>();
  private final SparseArray<Runnable> mTaskTimeouts = new SparseArray<>();

  private HeadlessJsTaskContext(ReactContext reactContext) {
    mReactContext = new WeakReference<ReactContext>(reactContext);
  }

  /** Register a task lifecycle event listener. */
  public void addTaskEventListener(HeadlessJsTaskEventListener listener) {
    mHeadlessJsTaskEventListeners.add(listener);
  }

  /** Unregister a task lifecycle event listener. */
  public void removeTaskEventListener(HeadlessJsTaskEventListener listener) {
    mHeadlessJsTaskEventListeners.remove(listener);
  }

  /** Get whether there are any running JS tasks at the moment. */
  public boolean hasActiveTasks() {
    return mActiveTasks.size() > 0;
  }

  /**
   * Start a JS task. Handles invoking {@link AppRegistry#startHeadlessTask} and notifying
   * listeners.
   *
   * @return a unique id representing this task instance.
   */
  public synchronized int startTask(final HeadlessJsTaskConfig taskConfig) {
    final int taskId = mLastTaskId.incrementAndGet();
    startTask(taskConfig, taskId);
    return taskId;
  }

  /**
   * Start a JS task the provided task id. Handles invoking {@link AppRegistry#startHeadlessTask}
   * and notifying listeners.
   */
  private synchronized void startTask(final HeadlessJsTaskConfig taskConfig, int taskId) {
    UiThreadUtil.assertOnUiThread();
    ReactContext reactContext =
        Assertions.assertNotNull(
            mReactContext.get(),
            "Tried to start a task on a react context that has already been destroyed");
    if (reactContext.getLifecycleState() == LifecycleState.RESUMED
        && !taskConfig.isAllowedInForeground()) {
      throw new IllegalStateException(
          "Tried to start task "
              + taskConfig.getTaskKey()
              + " while in foreground, but this is not allowed.");
    }
    mActiveTasks.add(taskId);
    mActiveTaskConfigs.put(taskId, new HeadlessJsTaskConfig(taskConfig));
    if (reactContext.hasActiveReactInstance()) {
      reactContext
          .getJSModule(AppRegistry.class)
          .startHeadlessTask(taskId, taskConfig.getTaskKey(), taskConfig.getData());
    } else {
      ReactSoftException.logSoftException(
          "HeadlessJsTaskContext",
          new RuntimeException("Cannot start headless task, CatalystInstance not available"));
    }
    if (taskConfig.getTimeout() > 0) {
      scheduleTaskTimeout(taskId, taskConfig.getTimeout());
    }
    for (HeadlessJsTaskEventListener listener : mHeadlessJsTaskEventListeners) {
      listener.onHeadlessJsTaskStart(taskId);
    }
  }

  /**
   * Retry a running JS task with a delay. Invokes {@link
   * HeadlessJsTaskContext#startTask(HeadlessJsTaskConfig, int)} as long as the process does not get
   * killed.
   *
   * @return true if a retry attempt has been posted.
   */
  public synchronized boolean retryTask(final int taskId) {
    final HeadlessJsTaskConfig sourceTaskConfig = mActiveTaskConfigs.get(taskId);
    Assertions.assertCondition(
        sourceTaskConfig != null,
        "Tried to retrieve non-existent task config with id " + taskId + ".");

    final HeadlessJsTaskRetryPolicy retryPolicy = sourceTaskConfig.getRetryPolicy();
    if (!retryPolicy.canRetry()) {
      return false;
    }

    removeTimeout(taskId);
    final HeadlessJsTaskConfig taskConfig =
        new HeadlessJsTaskConfig(
            sourceTaskConfig.getTaskKey(),
            sourceTaskConfig.getData(),
            sourceTaskConfig.getTimeout(),
            sourceTaskConfig.isAllowedInForeground(),
            retryPolicy.update());

    final Runnable retryAttempt =
        new Runnable() {
          @Override
          public void run() {
            startTask(taskConfig, taskId);
          }
        };

    UiThreadUtil.runOnUiThread(retryAttempt, retryPolicy.getDelay());
    return true;
  }

  /**
   * Finish a JS task. Doesn't actually stop the task on the JS side, only removes it from the list
   * of active tasks and notifies listeners. A task can only be finished once.
   *
   * @param taskId the unique id returned by {@link #startTask}.
   */
  public synchronized void finishTask(final int taskId) {
    Assertions.assertCondition(
        mActiveTasks.remove(taskId), "Tried to finish non-existent task with id " + taskId + ".");
    Assertions.assertCondition(
        mActiveTaskConfigs.remove(taskId) != null,
        "Tried to remove non-existent task config with id " + taskId + ".");
    removeTimeout(taskId);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            for (HeadlessJsTaskEventListener listener : mHeadlessJsTaskEventListeners) {
              listener.onHeadlessJsTaskFinish(taskId);
            }
          }
        });
  }

  private void removeTimeout(int taskId) {
    Runnable timeout = mTaskTimeouts.get(taskId);
    if (timeout != null) {
      mHandler.removeCallbacks(timeout);
      mTaskTimeouts.remove(taskId);
    }
  }

  /**
   * Check if a given task is currently running. A task is stopped if either {@link #finishTask} is
   * called or it times out.
   */
  public synchronized boolean isTaskRunning(final int taskId) {
    return mActiveTasks.contains(taskId);
  }

  private void scheduleTaskTimeout(final int taskId, long timeout) {
    Runnable runnable =
        new Runnable() {
          @Override
          public void run() {
            finishTask(taskId);
          }
        };
    mTaskTimeouts.append(taskId, runnable);
    mHandler.postDelayed(runnable, timeout);
  }
}
