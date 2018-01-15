/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.graphics.Bitmap;

/* package */ interface BitmapUpdateListener {
  public void onSecondaryAttach(Bitmap bitmap);
  public void onBitmapReady(Bitmap bitmap);
  public void onImageLoadEvent(int imageLoadEvent);
}
