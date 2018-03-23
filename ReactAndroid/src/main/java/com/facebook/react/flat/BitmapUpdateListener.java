/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.graphics.Bitmap;

/* package */ interface BitmapUpdateListener {
  public void onSecondaryAttach(Bitmap bitmap);
  public void onBitmapReady(Bitmap bitmap);
  public void onImageLoadEvent(int imageLoadEvent);
}
