/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.net.Uri;

/** Listener interface for global image loading events. */
public interface GlobalImageLoadListener {

  /** Called when a source has been set on an ImageView, but before it is actually loaded. */
  void onLoadAttempt(Uri uri);
}
