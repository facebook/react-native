/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.packagerconnection;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;

public abstract class NotificationOnlyHandler implements RequestHandler {
  private static final String TAG = JSPackagerClient.class.getSimpleName();

  public final void onRequest(@Nullable Object params, Responder responder) {
    responder.error("Request is not supported");
    FLog.e(TAG, "Request is not supported");
  }

  public abstract void onNotification(@Nullable Object params);
}
