/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import javax.annotation.Nullable;

import com.facebook.common.logging.FLog;

public abstract class NotificationOnlyHandler implements RequestHandler {
  private static final String TAG = JSPackagerClient.class.getSimpleName();

  final public void onRequest(@Nullable Object params, Responder responder) {
    responder.error("Request is not supported");
    FLog.e(TAG, "Request is not supported");
  }
  abstract public void onNotification(@Nullable Object params);
}
