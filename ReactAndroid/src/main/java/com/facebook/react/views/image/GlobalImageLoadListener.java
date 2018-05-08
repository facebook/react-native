// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.image;

import android.net.Uri;

/** Listener interface for global image loading events. */
public interface GlobalImageLoadListener {

  /** Called when a source has been set on an ImageView, but before it is actually loaded. */
  void onLoadAttempt(Uri uri);
}
