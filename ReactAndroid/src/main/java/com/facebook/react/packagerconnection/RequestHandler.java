/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.packagerconnection;

import androidx.annotation.Nullable;

public interface RequestHandler {
  void onRequest(@Nullable Object params, Responder responder);

  void onNotification(@Nullable Object params);
}
