/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.Nullable;

/**
 * This is a wrapper class for emphasizing that task failed due to bad {@code Executor}, rather than
 * the continuation block it self.
 */
public class ExecutorException extends RuntimeException {

  public ExecutorException(@Nullable Exception e) {
    super("An exception was thrown by an Executor", e);
  }
}
