/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import android.content.Context;
import android.view.TextureView;

/**
 * Custom {@link View} implementation that draws an ARTSurface React view and its children.
 */
public class ARTSurfaceView extends TextureView {
  public ARTSurfaceView(Context context) {
    super(context);
    setOpaque(false);
  }
}
