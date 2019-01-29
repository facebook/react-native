/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import javax.annotation.Nullable;

import com.facebook.common.logging.FLog;

public abstract class RequestOnlyHandler implements RequestHandler {
  private static final String TAG = JSPackagerClient.class.getSimpleName();

  abstract public void onRequest(@Nullable Object params, Responder responder);
  final public void onNotification(@Nullable Object params) {
    FLog.e(TAG, "Notification is not supported");
  }
}
