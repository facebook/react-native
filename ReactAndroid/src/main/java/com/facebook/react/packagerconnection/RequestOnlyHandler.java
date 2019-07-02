/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.packagerconnection;

import com.facebook.common.logging.FLog;
import javax.annotation.Nullable;

public abstract class RequestOnlyHandler implements RequestHandler {
  private static final String TAG = JSPackagerClient.class.getSimpleName();

  public abstract void onRequest(@Nullable Object params, Responder responder);

  public final void onNotification(@Nullable Object params) {
    FLog.e(TAG, "Notification is not supported");
  }
}
