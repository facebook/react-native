// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.jstasks;

import com.facebook.react.bridge.WritableMap;

/**
 * Class that holds the various parameters needed to start a JS task.
 */
public class HeadlessJsTaskConfig {
  private final String mTaskKey;
  private final WritableMap mData;
  private final long mTimeout;
  private final boolean mAllowedInForeground;

  /**
   * Create a HeadlessJsTaskConfig. Equivalent to calling
   * {@link #HeadlessJsTaskConfig(String, WritableMap, long, boolean)} with no timeout (0) and
   * {@code false} for {@code allowedInBackground}.
   */
  public HeadlessJsTaskConfig(String taskKey, WritableMap data) {
    this(taskKey, data, 0, false);
  }

  /**
   * Create a HeadlessJsTaskConfig. Equivalent to calling
   * {@link #HeadlessJsTaskConfig(String, WritableMap, long, boolean)} with {@code false} for
   * {@code allowedInBackground}.
   */
  public HeadlessJsTaskConfig(String taskKey, WritableMap data, long timeout) {
    this(taskKey, data, timeout, false);
  }

  /**
   * Create a HeadlessJsTaskConfig.
   *
   * @param taskKey the key for the JS task to execute. This is the same key that you call {@code
   * AppRegistry.registerTask} with in JS.
   * @param data a map of parameters passed to the JS task executor.
   * @param timeout the amount of time (in ms) after which the React instance should be terminated
   * regardless of whether the task has completed or not. This is meant as a safeguard against
   * accidentally keeping the device awake for long periods of time because JS crashed or some
   * request timed out. A value of 0 means no timeout (should only be used for long-running tasks
   * such as music playback).
   * @param allowedInForeground whether to allow this task to run while the app is in the foreground
   * (i.e. there is a host in resumed mode for the current ReactContext). Only set this to true if
   * you really need it. Note that tasks run in the same JS thread as UI code, so doing expensive
   * operations would degrade user experience.
   */
  public HeadlessJsTaskConfig(
    String taskKey,
    WritableMap data,
    long timeout,
    boolean allowedInForeground) {
    mTaskKey = taskKey;
    mData = data;
    mTimeout = timeout;
    mAllowedInForeground = allowedInForeground;
  }

  /* package */ String getTaskKey() {
    return mTaskKey;
  }

  /* package */ WritableMap getData() {
    return mData;
  }

  /* package */ long getTimeout() {
    return mTimeout;
  }

  /* package */ boolean isAllowedInForeground() {
    return mAllowedInForeground;
  }
}
