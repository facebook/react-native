/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.art;

import android.content.Context;
import android.view.TextureView;

/** Custom {@link View} implementation that draws an ARTSurface React view and its children. */
public class ARTSurfaceView extends TextureView {
  public ARTSurfaceView(Context context) {
    super(context);
    setOpaque(false);
  }
}
